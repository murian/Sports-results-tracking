import SwiftUI

struct ContentView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @State private var apiURL: String = ""
    @State private var showSettings = false

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.yellow)

                    Text("Fitness Sync")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Sync Apple Health to your Fitness Tracker")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                Spacer()

                // Authorization Status
                if !healthKitManager.isAuthorized {
                    VStack(spacing: 16) {
                        Image(systemName: "lock.shield")
                            .font(.system(size: 40))
                            .foregroundColor(.orange)

                        Text("Health Access Required")
                            .font(.headline)

                        Text("Allow access to read your weight and body composition data from Apple Health.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        Button(action: {
                            Task {
                                await healthKitManager.requestAuthorization()
                            }
                        }) {
                            Label("Grant Access", systemImage: "checkmark.shield")
                                .font(.headline)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.yellow)
                                .cornerRadius(12)
                        }
                        .padding(.horizontal)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    .padding(.horizontal)
                } else {
                    // Sync Controls
                    VStack(spacing: 16) {
                        // Records count
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Weight Records")
                                    .font(.headline)
                                Text("\(healthKitManager.weightRecords.count) records ready to sync")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Image(systemName: "scalemass.fill")
                                .font(.title)
                                .foregroundColor(.yellow)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)

                        // Last sync
                        if let lastSync = healthKitManager.lastSyncDate {
                            HStack {
                                Image(systemName: "clock")
                                    .foregroundColor(.secondary)
                                Text("Last sync: \(lastSync, formatter: dateFormatter)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        // Sync status
                        if !healthKitManager.syncStatus.isEmpty {
                            Text(healthKitManager.syncStatus)
                                .font(.subheadline)
                                .foregroundColor(healthKitManager.syncStatus.contains("Successfully") ? .green : .orange)
                                .multilineTextAlignment(.center)
                        }

                        // Fetch Button
                        Button(action: {
                            Task {
                                await healthKitManager.fetchWeightData()
                            }
                        }) {
                            Label("Fetch from Health", systemImage: "arrow.down.heart")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(12)
                        }

                        // Sync Button
                        Button(action: {
                            Task {
                                await healthKitManager.syncToServer()
                            }
                        }) {
                            if healthKitManager.isSyncing {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.yellow)
                                    .cornerRadius(12)
                            } else {
                                Label("Sync to Fitness Tracker", systemImage: "arrow.triangle.2.circlepath")
                                    .font(.headline)
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.yellow)
                                    .cornerRadius(12)
                            }
                        }
                        .disabled(healthKitManager.isSyncing || healthKitManager.weightRecords.isEmpty)
                    }
                    .padding(.horizontal)
                }

                Spacer()

                // Settings button
                Button(action: { showSettings = true }) {
                    Label("Settings", systemImage: "gear")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom)
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .environmentObject(healthKitManager)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }
}

struct SettingsView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @Environment(\.dismiss) var dismiss
    @State private var apiURL: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("API Configuration")) {
                    TextField("Your Fitness Tracker URL", text: $apiURL)
                        .textContentType(.URL)
                        .autocapitalization(.none)
                        .keyboardType(.URL)

                    Text("Enter your deployed Vercel app URL (e.g., https://your-app.vercel.app)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        healthKitManager.setAPIBaseURL(apiURL)
                        dismiss()
                    }
                }
            }
            .onAppear {
                apiURL = healthKitManager.getAPIBaseURL()
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(HealthKitManager())
}
