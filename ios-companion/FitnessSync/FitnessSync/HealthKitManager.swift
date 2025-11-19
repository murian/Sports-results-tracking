import Foundation
import HealthKit
import Combine

struct WeightRecord: Codable, Identifiable {
    let id: String
    let date: Date
    let weight: Double
    let bodyFat: Double?
    let leanMass: Double?
}

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()

    @Published var weightRecords: [WeightRecord] = []
    @Published var syncStatus: String = ""
    @Published var isSyncing = false

    init() {}

    func setAPIBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "apiBaseURL")
    }

    func getAPIBaseURL() -> String {
        UserDefaults.standard.string(forKey: "apiBaseURL") ?? ""
    }

    func setSyncToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "syncToken")
    }

    func getSyncToken() -> String {
        UserDefaults.standard.string(forKey: "syncToken") ?? ""
    }

    func fetchWeightData() async {
        let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
        let bodyFatType = HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage)!
        let leanMassType = HKQuantityType.quantityType(forIdentifier: .leanBodyMass)!

        // Request authorization
        let readTypes: Set<HKObjectType> = [weightType, bodyFatType, leanMassType]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            DispatchQueue.main.async {
                self.syncStatus = "Health access denied"
            }
            return
        }

        // Fetch last 90 days
        let startDate = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)

        // Fetch samples
        let weightSamples = await fetchSamples(type: weightType, predicate: predicate)
        let bodyFatSamples = await fetchSamples(type: bodyFatType, predicate: predicate)
        let leanMassSamples = await fetchSamples(type: leanMassType, predicate: predicate)

        // Group by date
        var recordsByDate: [String: WeightRecord] = [:]

        for sample in weightSamples {
            let dateKey = formatDateKey(sample.startDate)
            let weightKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))

            if recordsByDate[dateKey] == nil || sample.startDate > recordsByDate[dateKey]!.date {
                recordsByDate[dateKey] = WeightRecord(
                    id: "ios-\(dateKey)",
                    date: sample.startDate,
                    weight: round(weightKg * 10) / 10,
                    bodyFat: nil,
                    leanMass: nil
                )
            }
        }

        for sample in bodyFatSamples {
            let dateKey = formatDateKey(sample.startDate)
            let bodyFat = sample.quantity.doubleValue(for: .percent()) * 100

            if var record = recordsByDate[dateKey] {
                recordsByDate[dateKey] = WeightRecord(
                    id: record.id,
                    date: record.date,
                    weight: record.weight,
                    bodyFat: round(bodyFat * 10) / 10,
                    leanMass: record.leanMass
                )
            }
        }

        for sample in leanMassSamples {
            let dateKey = formatDateKey(sample.startDate)
            let leanMass = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))

            if var record = recordsByDate[dateKey] {
                recordsByDate[dateKey] = WeightRecord(
                    id: record.id,
                    date: record.date,
                    weight: record.weight,
                    bodyFat: record.bodyFat,
                    leanMass: round(leanMass * 10) / 10
                )
            }
        }

        let records = Array(recordsByDate.values).sorted { $0.date < $1.date }

        DispatchQueue.main.async {
            self.weightRecords = records
            self.syncStatus = "Found \(records.count) records"
        }
    }

    private func fetchSamples(type: HKQuantityType, predicate: NSPredicate) async -> [HKQuantitySample] {
        await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, _ in
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
        let token = getSyncToken()

        guard !apiURL.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "Set API URL in Settings"
            }
            return
        }

        guard !token.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "Set sync token in Settings"
            }
            return
        }

        DispatchQueue.main.async {
            self.isSyncing = true
            self.syncStatus = "Syncing..."
        }

        do {
            guard let url = URL(string: "\(apiURL)/api/sync?token=\(token)") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(weightRecords)

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            DispatchQueue.main.async {
                self.syncStatus = "Success! \(self.weightRecords.count) synced"
            }
        } catch {
            DispatchQueue.main.async {
                self.syncStatus = "Failed: \(error.localizedDescription)"
            }
        }

        DispatchQueue.main.async {
            self.isSyncing = false
        }
    }
}
