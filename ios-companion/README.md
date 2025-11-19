# FitnessSync iOS Companion App

A simple iOS app that syncs weight and body composition data from Apple Health to your Fitness Tracker web app.

## Requirements

- iOS 15.0 or later
- Xcode 14.0 or later
- Apple Developer account (for HealthKit capabilities)

## Setup

### 1. Open in Xcode

Open the `FitnessSync` folder in Xcode:
- File → Open → Select `ios-companion/FitnessSync` folder

### 2. Configure Signing

1. Select the project in the navigator
2. Select the "FitnessSync" target
3. Go to "Signing & Capabilities" tab
4. Select your team
5. Update the Bundle Identifier if needed

### 3. Add HealthKit Capability

1. In "Signing & Capabilities" tab
2. Click "+ Capability"
3. Add "HealthKit"
4. Check "Background Delivery" if you want background sync

### 4. Build and Run

1. Connect your iPhone or select a simulator
2. Press Cmd+R to build and run

## Usage

### First Time Setup

1. **Grant Health Access**: When prompted, allow the app to read weight and body composition data
2. **Set Sync Token**: Go to Settings and enter a unique token (e.g., "my-fitness-2024")
3. **Set API URL**: Enter your Fitness Tracker URL (e.g., "https://your-app.vercel.app")

### Syncing Data

1. **Fetch from Health**: Tap "Fetch from Health" to load your recent weight records
2. **Review Data**: Check the number of records ready to sync
3. **Sync to Tracker**: Tap "Sync to Fitness Tracker" to upload data

### Web App Setup

1. Go to the Smart Scale tab in your web app
2. Click the Settings (gear) icon
3. Enter the same sync token you used in the iOS app
4. Click "Sync from iOS" to fetch your data

## Data Synced

- **Weight** (HKQuantityTypeIdentifierBodyMass)
- **Body Fat Percentage** (HKQuantityTypeIdentifierBodyFatPercentage)
- **Lean Body Mass** (HKQuantityTypeIdentifierLeanBodyMass)

## Architecture

- **FitnessSyncApp.swift**: App entry point
- **ContentView.swift**: Main UI
- **HealthKitManager.swift**: HealthKit integration and API sync

## Notes

- The sync token links your iOS app to your web app - use the same token in both
- Data is synced via a simple REST API
- The app only reads from HealthKit, it doesn't write any data
- Records are deduplicated by date

## Troubleshooting

### "No records found"
- Make sure your scale app (e.g., Fitdays) is syncing to Apple Health
- Check that you've granted HealthKit read permissions
- Try fetching again after using your scale

### "Sync failed"
- Verify your API URL is correct
- Check your internet connection
- Make sure your web app is deployed and the API endpoint is working

### HealthKit permission denied
- Go to Settings → Privacy → Health → FitnessSync
- Enable all weight-related permissions
