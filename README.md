# MoodManage - Weather-Based Mood Tracker

A web application that tracks your mood based on current weather conditions using Firebase and geolocation.

## Features

- 🔐 User authentication (login)
- 🌤️ Real-time weather fetching based on your location
- 😊 Mood analysis based on weather conditions
- 💾 Cloud storage of mood check-ins with Firebase Firestore
- 📱 Responsive design

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing: "maps-assignment1")
3. Enable **Authentication** → Email/Password sign-in method
4. Enable **Firestore Database** in production mode
5. Get your Firebase config from Project Settings → General → Your apps
6. Replace the config in `app.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Fix Firestore Index Error

The error you're seeing requires creating a composite index in Firestore:

**Option 1: Automatic (Recommended)**
1. Click the link in the error message that appears in the console
2. It will take you directly to Firebase Console to create the index
3. Click "Create Index" and wait for it to build (usually 1-2 minutes)

**Option 2: Manual**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Configure:
   - Collection ID: `checkins`
   - Add fields in this order:
     - `uid` - Ascending
     - `timestamp` - Descending
   - Click "Create"

The full index URL from your error:
```
https://console.firebase.google.com/v1/r/project/maps-assignment1/firestore/indexes?create_composite=ClFwcm9qZWN0cy9tYXBzLWFzc2lnbm1lbnQxL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGVja2lucy9pbmRleGVzL18QARoHCgN1aWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC
```

### 3. Firestore Security Rules

Update your Firestore security rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /checkins/{checkIn} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

### 4. Run the Application

1. Serve the files using a local server (required for Firebase):

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve

# Or using PHP
php -S localhost:8000
```

2. Open `http://localhost:8000` in your browser
3. Allow location access when prompted
4. Create an account or login
5. Click "Check Weather & Mood"

## How It Works

1. **Authentication**: Users login or register with email/password
2. **Location**: App requests browser geolocation
3. **Weather**: Fetches current weather from Open-Meteo API (free, no key needed)
4. **Mood Analysis**: Analyzes weather data to suggest mood:
   - Temperature: 65-75°F = Pleasant
   - Clear skies = Bright and Positive
   - Rain = Cozy and Reflective
   - High winds = Restless
5. **Storage**: Saves check-ins to Firestore with timestamp

## Weather Mood Logic

- **Temperature**: 
  - 65-75°F → Pleasant
  - <40°F or >85°F → Uncomfortable
- **Conditions**:
  - Clear → Bright and Positive
  - Rain → Cozy and Reflective
  - Storms → Gloomy
- **Wind**: >20mph → Windy and Restless

## Technologies Used

- Firebase Authentication
- Firebase Firestore
- Open-Meteo Weather API
- Geolocation API
- Vanilla JavaScript (no frameworks)

## Troubleshooting

**"fetchWeather is not defined"**
- Make sure `app.js` is properly linked in `index.html`
- Check browser console for loading errors

**"Firestore index error"**
- Click the link in the error message to create the index
- Wait 1-2 minutes for index to build
- Refresh the page

**Location access denied**
- Enable location permissions in browser settings
- App requires location to fetch weather

**Firebase authentication errors**
- Verify Email/Password is enabled in Firebase Console
- Check that your Firebase config is correct

## Future Enhancements

- Display historical mood data
- Charts and trends over time
- Mood journaling with notes
- Weather notifications
- Export mood data
- Multiple check-ins per day