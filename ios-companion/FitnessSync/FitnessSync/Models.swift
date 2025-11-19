import Foundation

// MARK: - Data Models

struct BodyMeasurement: Codable, Identifiable {
    let id: String
    let date: Date
    let weight: Double?
    let chest: Double?
    let waist: Double?
    let hips: Double?
    let biceps: Double?
    let thighs: Double?
    let neck: Double?
    let shoulders: Double?
    let forearms: Double?
    let calves: Double?
    let notes: String?
}

struct BodyPhoto: Codable, Identifiable {
    let id: String
    let date: Date
    let imageData: String // Base64 encoded
    let angle: String
    let notes: String?
}

struct ScaleData: Codable, Identifiable {
    let id: String
    let date: Date
    let weight: Double
    let bodyFat: Double?
    let muscleMass: Double?
    let leanMass: Double?
    let boneMass: Double?
    let waterPercentage: Double?
    let visceralFat: Double?
    let bmr: Double?
    let metabolicAge: Double?
    let proteinPercentage: Double?
}

struct AppData: Codable {
    var measurements: [BodyMeasurement]
    var photos: [BodyPhoto]
    var scaleData: [ScaleData]
    var settings: [String: String]

    static let empty = AppData(measurements: [], photos: [], scaleData: [], settings: [:])
}

// MARK: - API Response

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: String?
}
