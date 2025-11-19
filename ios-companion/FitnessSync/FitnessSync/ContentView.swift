import SwiftUI

struct ContentView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @State private var showSettings = false

    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.yellow)

                Text("Fitness Sync")
                    .font(.title)
                    .fontWeight(.bold)
            }
            .padding(.top, 30)

            Spacer()

            // Main Content
            VStack(spacing: 16) {
                // Records count
                HStack {
                    VStack(alignment: .leading) {
                        Text("Weight Records")
                            .font(.headline)
                        Text("\(healthKitManager.weightRecords.count) ready to sync")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "scalemass.fill")
                        .font(.title2)
                        .foregroundColor(.yellow)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Status
                if !healthKitManager.syncStatus.isEmpty {
                    Text(healthKitManager.syncStatus)
                        .font(.caption)
                        .foregroundColor(healthKitManager.syncStatus.contains("Success") ? .green : .orange)
                }

                // Fetch Button
                Button {
                    Task { await healthKitManager.fetchWeightData() }
                } label: {
                    Label("Fetch from Health", systemImage: "arrow.down.heart")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                // Sync Button
                Button {
                    Task { await healthKitManager.syncToServer() }
                } label: {
                    if healthKitManager.isSyncing {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.yellow)
                            .cornerRadius(12)
                    } else {
                        Label("Sync to Tracker", systemImage: "arrow.up.circle")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.yellow)
                            .foregroundColor(.black)
                            .cornerRadius(12)
                    }
                }
                .disabled(healthKitManager.isSyncing || healthKitManager.weightRecords.isEmpty)
            }
            .padding(.horizontal)

            Spacer()

            // Settings
            Button { showSettings = true } label: {
                Label("Settings", systemImage: "gear")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
                .environmentObject(healthKitManager)
        }
        .preferredColorScheme(.dark)
    }
}

struct SettingsView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @Environment(\.dismiss) var dismiss
    @State private var apiURL: String = ""
    @State private var syncToken: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sync Configuration")) {
                    TextField("API URL", text: $apiURL)
                        .autocapitalization(.none)
                        .keyboardType(.URL)

                    TextField("Sync Token", text: $syncToken)
                        .autocapitalization(.none)

                    Text("Use same token in web app")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        healthKitManager.setAPIBaseURL(apiURL)
                        healthKitManager.setSyncToken(syncToken)
                        dismiss()
                    }
                }
            }
            .onAppear {
                apiURL = healthKitManager.getAPIBaseURL()
                syncToken = healthKitManager.getSyncToken()
            }
        }
    }
}
