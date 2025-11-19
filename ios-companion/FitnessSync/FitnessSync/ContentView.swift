import SwiftUI

struct ContentView: View {
    @EnvironmentObject var apiClient: APIClient
    @EnvironmentObject var healthKit: HealthKitManager
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }
                .tag(0)

            MeasurementsView()
                .tabItem {
                    Image(systemName: "ruler")
                    Text("Measurements")
                }
                .tag(1)

            PhotosView()
                .tabItem {
                    Image(systemName: "camera.fill")
                    Text("Photos")
                }
                .tag(2)

            SmartScaleView()
                .tabItem {
                    Image(systemName: "scalemass.fill")
                    Text("Scale")
                }
                .tag(3)

            ProgressView()
                .tabItem {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                    Text("Progress")
                }
                .tag(4)
        }
        .tint(.yellow)
        .preferredColorScheme(.dark)
        .onAppear {
            // Load data when app appears
            Task {
                await apiClient.fetchAllData()
            }
        }
    }
}

// MARK: - Dashboard View

struct DashboardView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Sync Status
                    if !apiClient.syncStatus.isEmpty {
                        Text(apiClient.syncStatus)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Stats Cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        StatCard(
                            title: "Latest Weight",
                            value: latestWeight,
                            unit: "kg",
                            icon: "scalemass.fill"
                        )

                        StatCard(
                            title: "Measurements",
                            value: "\(apiClient.appData.measurements.count)",
                            unit: "records",
                            icon: "ruler"
                        )

                        StatCard(
                            title: "Photos",
                            value: "\(apiClient.appData.photos.count)",
                            unit: "saved",
                            icon: "camera.fill"
                        )

                        StatCard(
                            title: "Weight Records",
                            value: "\(apiClient.appData.scaleData.count)",
                            unit: "entries",
                            icon: "chart.bar.fill"
                        )
                    }

                    // Refresh Button
                    Button {
                        Task { await apiClient.fetchAllData() }
                    } label: {
                        Label("Refresh Data", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.yellow)
                            .foregroundColor(.black)
                            .cornerRadius(12)
                    }
                    .disabled(apiClient.isSyncing)
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .background(Color.black)
        }
    }

    var latestWeight: String {
        if let latest = apiClient.appData.scaleData.first {
            return String(format: "%.1f", latest.weight)
        }
        return "--"
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.yellow)
                Spacer()
            }
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(unit)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Measurements View

struct MeasurementsView: View {
    @EnvironmentObject var apiClient: APIClient
    @State private var showAddSheet = false

    var body: some View {
        NavigationView {
            List {
                ForEach(apiClient.appData.measurements) { measurement in
                    MeasurementRow(measurement: measurement)
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let id = apiClient.appData.measurements[index].id
                        apiClient.deleteMeasurement(id)
                    }
                }
            }
            .navigationTitle("Measurements")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showAddSheet = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddSheet) {
                AddMeasurementView()
            }
        }
    }
}

struct MeasurementRow: View {
    let measurement: BodyMeasurement

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(measurement.date, style: .date)
                .font(.headline)
            HStack {
                if let weight = measurement.weight {
                    Label("\(String(format: "%.1f", weight)) kg", systemImage: "scalemass")
                }
                if let chest = measurement.chest {
                    Label("\(String(format: "%.1f", chest)) cm", systemImage: "heart")
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct AddMeasurementView: View {
    @EnvironmentObject var apiClient: APIClient
    @Environment(\.dismiss) var dismiss

    @State private var date = Date()
    @State private var weight = ""
    @State private var chest = ""
    @State private var waist = ""
    @State private var hips = ""

    var body: some View {
        NavigationView {
            Form {
                DatePicker("Date", selection: $date, displayedComponents: .date)

                Section(header: Text("Measurements")) {
                    TextField("Weight (kg)", text: $weight)
                        .keyboardType(.decimalPad)
                    TextField("Chest (cm)", text: $chest)
                        .keyboardType(.decimalPad)
                    TextField("Waist (cm)", text: $waist)
                        .keyboardType(.decimalPad)
                    TextField("Hips (cm)", text: $hips)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add Measurement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let measurement = BodyMeasurement(
                            id: UUID().uuidString,
                            date: date,
                            weight: Double(weight),
                            chest: Double(chest),
                            waist: Double(waist),
                            hips: Double(hips),
                            biceps: nil,
                            thighs: nil,
                            neck: nil,
                            shoulders: nil,
                            forearms: nil,
                            calves: nil,
                            notes: nil
                        )
                        apiClient.addMeasurement(measurement)
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Photos View

struct PhotosView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        NavigationView {
            ScrollView {
                if apiClient.appData.photos.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "camera")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No photos yet")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.top, 100)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                        ForEach(apiClient.appData.photos) { photo in
                            PhotoThumbnail(photo: photo)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Photos")
        }
    }
}

struct PhotoThumbnail: View {
    let photo: BodyPhoto

    var body: some View {
        VStack {
            if let imageData = Data(base64Encoded: photo.imageData),
               let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 100, height: 100)
                    .clipped()
                    .cornerRadius(8)
            } else {
                Rectangle()
                    .fill(Color.gray)
                    .frame(width: 100, height: 100)
                    .cornerRadius(8)
            }
            Text(photo.date, style: .date)
                .font(.caption2)
        }
    }
}

// MARK: - Smart Scale View

struct SmartScaleView: View {
    @EnvironmentObject var apiClient: APIClient
    @EnvironmentObject var healthKit: HealthKitManager
    @State private var showAddSheet = false
    @State private var showSettings = false

    var body: some View {
        NavigationView {
            List {
                // HealthKit Sync Section
                Section {
                    Button {
                        Task { await healthKit.fetchWeightData() }
                    } label: {
                        Label("Fetch from Apple Health", systemImage: "heart.fill")
                    }

                    if !healthKit.weightRecords.isEmpty {
                        Button {
                            // Add HealthKit records to app data
                            for record in healthKit.weightRecords {
                                let scaleData = ScaleData(
                                    id: record.id,
                                    date: record.date,
                                    weight: record.weight,
                                    bodyFat: record.bodyFat,
                                    muscleMass: nil,
                                    leanMass: record.leanMass,
                                    boneMass: nil,
                                    waterPercentage: nil,
                                    visceralFat: nil,
                                    bmr: nil,
                                    metabolicAge: nil,
                                    proteinPercentage: nil
                                )
                                apiClient.addScaleData(scaleData)
                            }
                        } label: {
                            Label("Import \(healthKit.weightRecords.count) records", systemImage: "square.and.arrow.down")
                        }
                    }

                    if !healthKit.syncStatus.isEmpty {
                        Text(healthKit.syncStatus)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Weight Records
                Section(header: Text("Weight History")) {
                    ForEach(apiClient.appData.scaleData) { data in
                        ScaleDataRow(data: data)
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            let id = apiClient.appData.scaleData[index].id
                            apiClient.deleteScaleData(id)
                        }
                    }
                }
            }
            .navigationTitle("Smart Scale")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    HStack {
                        Button { showSettings = true } label: {
                            Image(systemName: "gear")
                        }
                        Button { showAddSheet = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showAddSheet) {
                AddScaleDataView()
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
}

struct ScaleDataRow: View {
    let data: ScaleData

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(String(format: "%.1f kg", data.weight))
                    .font(.headline)
                    .foregroundColor(.yellow)
                Spacer()
                Text(data.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            if let bodyFat = data.bodyFat {
                Text("Body Fat: \(String(format: "%.1f", bodyFat))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddScaleDataView: View {
    @EnvironmentObject var apiClient: APIClient
    @Environment(\.dismiss) var dismiss

    @State private var date = Date()
    @State private var weight = ""
    @State private var bodyFat = ""

    var body: some View {
        NavigationView {
            Form {
                DatePicker("Date", selection: $date, displayedComponents: .date)

                Section(header: Text("Weight Data")) {
                    TextField("Weight (kg)", text: $weight)
                        .keyboardType(.decimalPad)
                    TextField("Body Fat %", text: $bodyFat)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add Weight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        guard let weightValue = Double(weight) else { return }
                        let data = ScaleData(
                            id: UUID().uuidString,
                            date: date,
                            weight: weightValue,
                            bodyFat: Double(bodyFat),
                            muscleMass: nil,
                            leanMass: nil,
                            boneMass: nil,
                            waterPercentage: nil,
                            visceralFat: nil,
                            bmr: nil,
                            metabolicAge: nil,
                            proteinPercentage: nil
                        )
                        apiClient.addScaleData(data)
                        dismiss()
                    }
                    .disabled(weight.isEmpty)
                }
            }
        }
    }
}

// MARK: - Progress View

struct ProgressView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if apiClient.appData.scaleData.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 50))
                                .foregroundColor(.secondary)
                            Text("No data yet")
                                .foregroundColor(.secondary)
                            Text("Add weight records to see your progress")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 100)
                    } else {
                        // Weight Summary
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Weight Summary")
                                .font(.headline)

                            HStack {
                                VStack {
                                    Text("Current")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(String(format: "%.1f", apiClient.appData.scaleData.first?.weight ?? 0))
                                        .font(.title2)
                                        .fontWeight(.bold)
                                    Text("kg")
                                        .font(.caption)
                                }
                                .frame(maxWidth: .infinity)

                                VStack {
                                    Text("Change")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(weightChange)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(weightChangeColor)
                                    Text("kg")
                                        .font(.caption)
                                }
                                .frame(maxWidth: .infinity)

                                VStack {
                                    Text("Records")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text("\(apiClient.appData.scaleData.count)")
                                        .font(.title2)
                                        .fontWeight(.bold)
                                    Text("total")
                                        .font(.caption)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)

                        // Recent Records
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Records")
                                .font(.headline)

                            ForEach(apiClient.appData.scaleData.prefix(10)) { data in
                                HStack {
                                    Text(data.date, style: .date)
                                        .font(.caption)
                                    Spacer()
                                    Text(String(format: "%.1f kg", data.weight))
                                        .fontWeight(.semibold)
                                        .foregroundColor(.yellow)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Progress")
            .background(Color.black)
        }
    }

    var weightChange: String {
        guard apiClient.appData.scaleData.count >= 2 else { return "--" }
        let first = apiClient.appData.scaleData.first!.weight
        let last = apiClient.appData.scaleData.last!.weight
        let change = first - last
        return String(format: "%+.1f", change)
    }

    var weightChangeColor: Color {
        guard apiClient.appData.scaleData.count >= 2 else { return .primary }
        let first = apiClient.appData.scaleData.first!.weight
        let last = apiClient.appData.scaleData.last!.weight
        return first < last ? .green : (first > last ? .red : .primary)
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @EnvironmentObject var apiClient: APIClient
    @Environment(\.dismiss) var dismiss
    @State private var apiURL = ""
    @State private var syncToken = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sync Configuration")) {
                    TextField("API URL", text: $apiURL)
                        .autocapitalization(.none)
                        .keyboardType(.URL)

                    TextField("Sync Token", text: $syncToken)
                        .autocapitalization(.none)

                    Text("Use same token in web app to sync data")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section {
                    Button {
                        Task { await apiClient.fetchAllData() }
                        dismiss()
                    } label: {
                        Label("Refresh Data", systemImage: "arrow.clockwise")
                    }

                    Button {
                        Task { await apiClient.syncAllData() }
                        dismiss()
                    } label: {
                        Label("Force Sync", systemImage: "arrow.triangle.2.circlepath")
                    }
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
                        apiClient.setAPIBaseURL(apiURL)
                        apiClient.setSyncToken(syncToken)
                        dismiss()
                    }
                }
            }
            .onAppear {
                apiURL = apiClient.getAPIBaseURL()
                syncToken = apiClient.getSyncToken()
            }
        }
    }
}
