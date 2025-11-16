# FitTrack Pro - Fitness Journey Tracker

A modern, feature-rich fitness tracking application built with React, TypeScript, and Tailwind CSS. Track your fitness journey with body measurements, progress photos, smart scale integration, and detailed analytics.

## Features

### 📊 Body Measurements
- Track comprehensive body measurements including:
  - Weight, Body Fat %, BMI, Muscle Mass
  - Chest, Waist, Hips, Thighs, Arms, Calves, Shoulders, Neck
- Add notes to each measurement
- View measurement history with detailed breakdowns

### 📸 Progress Photos
- Upload front, side, and back photos
- Compare photos side-by-side to visualize your progress
- **AI-Powered Analysis** with Google Gemini 2.0 Flash:
  - Select any two photo sets to compare
  - Get detailed insights on body transformation
  - Receive specific observations on muscle development, body composition changes
  - Get personalized recommendations for continued progress
- Track your visual transformation over time
- Add notes to document your journey

### ⚖️ Smart Scale Integration
- Connect Bluetooth-enabled smart scales (Web Bluetooth API)
- Automatically sync weight and body composition data
- Manual entry option for any smart scale data
- Track additional metrics:
  - Weight, Body Fat %, Muscle Mass, Bone Mass
  - Water %, Visceral Fat, BMR, Metabolic Age, Protein %

### 📈 Progress Analytics
- Beautiful charts and visualizations using Recharts
- Track trends over time for:
  - Weight progression
  - Body fat percentage
  - Muscle mass
  - Body measurements
- View percentage changes and trends
- Identify patterns in your fitness journey

### 📱 Progressive Web App (PWA)
- Install on your phone or desktop
- Works offline
- Mobile-responsive design
- Native app-like experience

### 🎨 Modern Design
- Sleek black and yellow color scheme
- Glass-morphism effects
- Smooth animations and transitions
- Fully responsive for desktop and mobile
- Custom scrollbars

## Tech Stack

- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Recharts** - Beautiful data visualization
- **Lucide React** - Modern icon library
- **date-fns** - Date manipulation and formatting
- **Google Gemini AI** - AI-powered photo analysis
- **Web Bluetooth API** - Smart scale integration
- **LocalStorage** - Client-side data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Sports-results-tracking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Dashboard
View your fitness journey overview, latest measurements, and quick stats.

### Measurements
Add and track detailed body measurements over time. All measurements are optional - track what matters to you!

### Progress Photos
Upload progress photos to visually document your transformation. Use the compare feature to see changes side-by-side.

**AI Photo Analysis:**
1. Click "AI Config" to set up your Google Gemini API key (free at [Google AI Studio](https://aistudio.google.com/apikey))
2. Click "Compare" mode and select any 2 photo sets
3. Click "Get AI Insights" to receive detailed analysis including:
   - Overall body transformation assessment
   - Specific changes in muscle development and body composition
   - Personalized recommendations for continued progress
4. AI uses Google Gemini 2.0 Flash for accurate, detailed analysis

### Smart Scale
Connect your Bluetooth smart scale for automatic data syncing, or manually enter data from any smart scale.

**Bluetooth Support:**
- Chrome, Edge, Opera (Desktop and Android)
- Ensure Bluetooth is enabled on your device
- Grant permission when prompted

### Progress & Analytics
View detailed charts and analytics showing your progress over time. Track trends, identify patterns, and celebrate your achievements!

## Data Storage

All data is stored locally in your browser using LocalStorage. Your data never leaves your device.

**Important:**
- Clear browser data will delete your tracking data
- Export your data regularly for backup
- Data is specific to each browser/device

## Browser Compatibility

- **Chrome/Edge/Opera** - Full support including Bluetooth
- **Firefox** - Full support except Bluetooth
- **Safari** - Full support except Bluetooth

For smart scale integration, use Chrome, Edge, or Opera.

## Color Scheme

- **Primary Yellow:** `#FFCC00`
- **Dark Background:** `#0A0A0A` to `#1A1A1A`
- Modern glassmorphism effects
- High contrast for accessibility

## Project Structure

```
src/
├── components/        # React components
│   ├── Dashboard.tsx
│   ├── Measurements.tsx
│   ├── Photos.tsx
│   ├── SmartScale.tsx
│   └── Progress.tsx
├── utils/            # Utility functions
│   └── storage.ts    # LocalStorage management
├── types.ts          # TypeScript interfaces
├── bluetooth.d.ts    # Bluetooth API types
├── App.tsx           # Main app component
├── main.tsx          # App entry point
└── index.css         # Global styles & Tailwind

public/
└── manifest.json     # PWA manifest
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your fitness journey!

## Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
- Built with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Start tracking your fitness journey today!** 💪
