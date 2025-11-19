import Foundation

class APIClient: ObservableObject {
    @Published var appData: AppData = .empty
    @Published var isSyncing = false
    @Published var syncStatus = ""

    private var apiBaseURL: String {
        UserDefaults.standard.string(forKey: "apiBaseURL") ?? ""
    }

    private var syncToken: String {
        UserDefaults.standard.string(forKey: "syncToken") ?? "default"
    }

    func setAPIBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "apiBaseURL")
    }

    func getAPIBaseURL() -> String {
        apiBaseURL
    }

    func setSyncToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "syncToken")
    }

    func getSyncToken() -> String {
        syncToken
    }

    // MARK: - Fetch All Data

    func fetchAllData() async {
        guard !apiBaseURL.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "Set API URL in Settings"
            }
            return
        }

        DispatchQueue.main.async {
            self.isSyncing = true
            self.syncStatus = "Loading..."
        }

        do {
            guard let url = URL(string: "\(apiBaseURL)/api/data?token=\(syncToken)") else {
                throw URLError(.badURL)
            }

            let (data, response) = try await URLSession.shared.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601

            struct Response: Codable {
                let success: Bool
                let data: AppData
            }

            let result = try decoder.decode(Response.self, from: data)

            if result.success {
                DispatchQueue.main.async {
                    self.appData = result.data
                    self.syncStatus = "Loaded \(result.data.measurements.count) measurements, \(result.data.scaleData.count) weights"
                }
            }
        } catch {
            DispatchQueue.main.async {
                self.syncStatus = "Load failed: \(error.localizedDescription)"
            }
        }

        DispatchQueue.main.async {
            self.isSyncing = false
        }
    }

    // MARK: - Sync All Data

    func syncAllData() async {
        guard !apiBaseURL.isEmpty else {
            DispatchQueue.main.async {
                self.syncStatus = "Set API URL in Settings"
            }
            return
        }

        DispatchQueue.main.async {
            self.isSyncing = true
            self.syncStatus = "Syncing..."
        }

        do {
            guard let url = URL(string: "\(apiBaseURL)/api/data?token=\(syncToken)&type=sync") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601

            let syncData: [String: Any] = [
                "measurements": try JSONSerialization.jsonObject(with: encoder.encode(appData.measurements)),
                "photos": try JSONSerialization.jsonObject(with: encoder.encode(appData.photos)),
                "scaleData": try JSONSerialization.jsonObject(with: encoder.encode(appData.scaleData)),
                "settings": appData.settings
            ]

            request.httpBody = try JSONSerialization.data(withJSONObject: syncData)

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            DispatchQueue.main.async {
                self.syncStatus = "Synced successfully"
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

    // MARK: - Add/Update Data

    func addMeasurement(_ measurement: BodyMeasurement) {
        appData.measurements.append(measurement)
        appData.measurements.sort { $0.date > $1.date }
        Task { await syncAllData() }
    }

    func addPhoto(_ photo: BodyPhoto) {
        appData.photos.append(photo)
        appData.photos.sort { $0.date > $1.date }
        Task { await syncAllData() }
    }

    func addScaleData(_ data: ScaleData) {
        appData.scaleData.append(data)
        appData.scaleData.sort { $0.date > $1.date }
        Task { await syncAllData() }
    }

    func deleteMeasurement(_ id: String) {
        appData.measurements.removeAll { $0.id == id }
        Task { await syncAllData() }
    }

    func deletePhoto(_ id: String) {
        appData.photos.removeAll { $0.id == id }
        Task { await syncAllData() }
    }

    func deleteScaleData(_ id: String) {
        appData.scaleData.removeAll { $0.id == id }
        Task { await syncAllData() }
    }
}
