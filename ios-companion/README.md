# FitnessSync iOS Companion App

A simple iOS app that syncs weight and body composition data from Apple Health to your Fitness Tracker web app.

## Requirements

- iOS 17.0 or later
- Xcode 26 or later
- Apple Developer account (for HealthKit capabilities)

## Setup in Xcode 26

### 1. Create the Xcode Project

Since Xcode 26 uses a new project format, create a new project and add the source files:

1. Open Xcode
2. **File → New → Project**
3. Select **iOS → App**
4. Configure:
   - Product Name: `FitnessSync`
   - Team: Select your Apple Developer account
   - Organization Identifier: `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
5. Click **Next** and save the project

### 2. Add Source Files

Copy the Swift files from this repository into your Xcode project:

1. In Finder, navigate to `ios-companion/FitnessSync/FitnessSync/`
2. Copy these files:
   - `FitnessSyncApp.swift`
   - `ContentView.swift`
   - `HealthKitManager.swift`
3. In Xcode, right-click on the `FitnessSync` folder in the Navigator
4. Select **Add Files to "FitnessSync"**
5. Select the copied Swift files
6. Replace any existing files when prompted

### 3. Configure HealthKit Capability

#### Method 1: Using the New UI

1. Click on your **project name** (blue icon) in the Navigator (left sidebar)
2. In the editor area, look for **"Signing & Capabilities"** or **"Capabilities"**
   - In Xcode 26, this may be in the **Inspector** (right sidebar) - press **Cmd+Option+0**
   - Or look for a **"+"** button to add capabilities
3. Click **"+ Capability"** or **"Add Capability"**
4. Search for **"HealthKit"** and add it
5. Enable **"Background Delivery"** checkbox if available

#### Method 2: Edit Info.plist Directly

1. In Navigator, find **Info.plist** (or Info tab in target settings)
2. Add these keys:
   - `NSHealthShareUsageDescription`: "This app reads your weight and body composition data from Apple Health to sync with your Fitness Tracker web app."
   - `NSHealthUpdateUsageDescription`: "This app does not write data to Apple Health."

#### Method 3: Add Entitlements File

1. **File → New → File**
2. Search for **"Entitlements"** or **"Property List"**
3. Name it `FitnessSync.entitlements`
4. Add these entries:
```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array/>
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

### 4. Configure Signing

1. Click on the **project** in Navigator
2. Find **Signing** settings (may be in Inspector panel on right, or in a Signing tab)
3. Enable **"Automatically manage signing"**
4. Select your **Team** from the dropdown
5. If you see errors, try:
   - Changing the Bundle Identifier to something unique (e.g., `com.yourname.fitnesssync`)
   - Ensuring your Apple Developer account is signed in (**Xcode → Settings → Accounts**)

### 5. Build and Run

1. Connect your iPhone via USB or select it from the device menu
2. Press **Cmd+R** or click the **Play** button
3. If prompted on your iPhone, trust the developer in **Settings → General → VPN & Device Management**

## Usage

### First Time Setup

1. **Grant Health Access**: When prompted, allow the app to read weight and body composition data
2. **Set Sync Token**: Tap Settings (gear icon) and enter a unique token (e.g., "my-fitness-2024")
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

## Troubleshooting Xcode 26

### Can't find Signing & Capabilities
- Try **View → Inspectors → Show Inspector** or press **Cmd+Option+0**
- Click on the target (not project) and check the right sidebar
- Or use **Product → Destination → Manage Run Destinations** and look for signing options

### HealthKit capability not available
- Make sure you're signed in with an Apple Developer account
- Go to **Xcode → Settings → Accounts** and add your Apple ID
- You need at least a free Apple Developer account

### Build errors about HealthKit
- Ensure the entitlements file is properly linked to your target
- Check that Info.plist has the required usage descriptions
- Clean build folder: **Product → Clean Build Folder** (Cmd+Shift+K)

### Device not showing
- Make sure your iPhone is unlocked and trusted
- Try **Window → Devices and Simulators** to see connected devices
- Update iOS to match Xcode 26 requirements

## Data Synced

- **Weight** (HKQuantityTypeIdentifierBodyMass)
- **Body Fat Percentage** (HKQuantityTypeIdentifierBodyFatPercentage)
- **Lean Body Mass** (HKQuantityTypeIdentifierLeanBodyMass)

## Architecture

- **FitnessSyncApp.swift**: App entry point
- **ContentView.swift**: Main UI with SwiftUI
- **HealthKitManager.swift**: HealthKit integration and API sync

## Notes

- The sync token links your iOS app to your web app - use the same token in both
- Data is synced via a simple REST API
- The app only reads from HealthKit, it doesn't write any data
- Records are deduplicated by date

## General Troubleshooting

### "No records found"
- Make sure your scale app (e.g., Fitdays) is syncing to Apple Health
- Check that you've granted HealthKit read permissions
- Try fetching again after using your scale

### "Sync failed"
- Verify your API URL is correct (include https://)
- Check your internet connection
- Make sure your web app is deployed and the API endpoint is working

### HealthKit permission denied
- Go to **Settings → Privacy & Security → Health → FitnessSync**
- Enable all weight-related permissions
