import SwiftUI
import HealthKit

@main
struct FitnessSyncApp: App {
    @StateObject private var apiClient = APIClient()
    @StateObject private var healthKitManager = HealthKitManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(apiClient)
                .environmentObject(healthKitManager)
        }
    }
}
