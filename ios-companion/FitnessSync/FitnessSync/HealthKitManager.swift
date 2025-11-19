import Foundation
import HealthKit

struct WeightRecord: Codable, Identifiable {
    let id: String
    let date: Date
    let weight: Double
    let bodyFat: Double?
    let leanMass: Double?

    enum CodingKeys: String, CodingKey {
        case id, date, weight, bodyFat, leanMass
    }
}

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()

    @Published var isAuthorized = false
    @Published var weightRecords: [WeightRecord] = []
    @Published var lastSyncDate: Date?
    @Published var syncStatus: String = ""
    @Published var isSyncing = false

    private let apiBaseURL: String

    init() {
        // Load API URL from UserDefaults or use default
        self.apiBaseURL = UserDefaults.standard.string(forKey: "apiBaseURL") ?? ""
        checkAuthorization()
    }

    func setAPIBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "apiBaseURL")
    }

    func getAPIBaseURL() -> String {
        return UserDefaults.standard.string(forKey: "apiBaseURL") ?? ""
    }

    private func checkAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            return
        }

        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .bodyMass)!,
            HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)!,
            HKObjectType.quantityType(forIdentifier: .leanBodyMass)!
        ]

        healthStore.getRequestStatusForAuthorization(toShare: [], read: readTypes) { status, error in
            DispatchQueue.main.async {
                self.isAuthorized = (status == .unnecessary)
            }
        }
    }

    func requestAuthorization() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else {
            return false
        }

        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .bodyMass)!,
            HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)!,
            HKObjectType.quantityType(forIdentifier: .leanBodyMass)!
        ]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            DispatchQueue.main.async {
                self.isAuthorized = true
            }
            return true
        } catch {
            print("HealthKit authorization failed: \(error)")
            return false
        }
    }

    func fetchWeightData(from startDate: Date? = nil) async {
        guard isAuthorized else { return }

        let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
        let bodyFatType = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage)!
        let leanMassType = HKQuantityType.quantityType(forIdentifier: .leanBodyMass)!

        // Default to last 30 days if no start date provided
        let queryStartDate = startDate ?? Calendar.current.date(byAdding: .day, value: -30, to: Date())!

        let predicate = HKQuery.predicateForSamples(
            withStart: queryStartDate,
            end: Date(),
            options: .strictStartDate
        )

        // Fetch weight samples
        let weightSamples = await fetchSamples(type: weightType, predicate: predicate)
        let bodyFatSamples = await fetchSamples(type: bodyFatType, predicate: predicate)
        let leanMassSamples = await fetchSamples(type: leanMassType, predicate: predicate)

        // Group by date
        var recordsByDate: [String: WeightRecord] = [:]
        let dateFormatter = ISO8601DateFormatter()

        for sample in weightSamples {
            let dateKey = formatDateKey(sample.startDate)
            let weightKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))

            let existing = recordsByDate[dateKey]
            if existing == nil || sample.startDate > existing!.date {
                recordsByDate[dateKey] = WeightRecord(
                    id: "ios-\(dateKey)-\(Int(Date().timeIntervalSince1970 * 1000))",
                    date: sample.startDate,
                    weight: round(weightKg * 10) / 10,
                    bodyFat: existing?.bodyFat,
                    leanMass: existing?.leanMass
                )
            }
        }

        // Add body fat data
        for sample in bodyFatSamples {
            let dateKey = formatDateKey(sample.startDate)
            let bodyFatPercent = sample.quantity.doubleValue(for: .percent()) * 100

            if var record = recordsByDate[dateKey] {
                recordsByDate[dateKey] = WeightRecord(
                    id: record.id,
                    date: record.date,
                    weight: record.weight,
                    bodyFat: round(bodyFatPercent * 10) / 10,
                    leanMass: record.leanMass
                )
            }
        }

        // Add lean mass data
        for sample in leanMassSamples {
            let dateKey = formatDateKey(sample.startDate)
            let leanMassKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))

            if var record = recordsByDate[dateKey] {
                recordsByDate[dateKey] = WeightRecord(
                    id: record.id,
                    date: record.date,
                    weight: record.weight,
                    bodyFat: record.bodyFat,
                    leanMass: round(leanMassKg * 10) / 10
                )
            }
        }

        let records = Array(recordsByDate.values).sorted { $0.date < $1.date }

        DispatchQueue.main.async {
            self.weightRecords = records
        }
    }

    private func fetchSamples(type: HKQuantityType, predicate: NSPredicate) async -> [HKQuantitySample] {
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, error in
                if let error = error {
                    print("Error fetching \(type): \(error)")
                    continuation.resume(returning: [])
                    return
                }
                continuation.resume(returning: samples as? [HKQuantitySample] ?? [])
            }
            healthStore.execute(query)
        }
    }

    private func formatDateKey(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    func syncToServer() async {
        guard !weightRecords.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "No records to sync"
            }
            return
        }

        let apiURL = getAPIBaseURL()
        guard !apiURL.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "Please set your API URL first"
            }
            return
        }

        DispatchQueue.main.async {
            self.isSyncing = true
            self.syncStatus = "Syncing..."
        }

        do {
            guard let url = URL(string: "\(apiURL)/api/sync") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(weightRecords)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            if httpResponse.statusCode == 200 {
                DispatchQueue.main.async {
                    self.syncStatus = "Successfully synced \(self.weightRecords.count) records"
                    self.lastSyncDate = Date()
                    UserDefaults.standard.set(Date(), forKey: "lastSyncDate")
                }
            } else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw NSError(domain: "", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage])
            }
        } catch {
            DispatchQueue.main.async {
                self.syncStatus = "Sync failed: \(error.localizedDescription)"
            }
        }

        DispatchQueue.main.async {
            self.isSyncing = false
        }
    }
}
