const firebaseConfig = {
  apiKey: "AIzaSyC1k6nOUecBdG2EDc5bFB7LU_xF5gb6yvA",
  authDomain: "maps-assignment1.firebaseapp.com",
  projectId: "maps-assignment1",
  storageBucket: "maps-assignment1.firebasestorage.app",
  messagingSenderId: "933738505489",
  appId: "1:933738505489:web:6a15b27a3d2d6ad84798b0",
  measurementId: "G-H6367MHT55"
};


firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user').textContent = `Logged in as: ${user.email}`;
  } else {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('app').style.display = 'none';
  }
});

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // If user doesn't exist, create new account
      try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('Account created successfully!');
      } catch (createError) {
        alert(`Error creating account: ${createError.message}`);
      }
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}

// Logout
function logout() {
  auth.signOut();
}

// Fetch weather and analyze mood
async function fetchWeather() {
  const statusEl = document.getElementById('status');
  const weatherEl = document.getElementById('weather');
  const moodEl = document.getElementById('mood');

  statusEl.textContent = 'Fetching weather...';

  try {
    // Get user's location
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = position.coords;

    // Fetch weather data from Open-Meteo (free, no API key needed)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit`
    );

    const weatherData = await weatherResponse.json();
    const temp = weatherData.current.temperature_2m;
    const weatherCode = weatherData.current.weather_code;
    const windSpeed = weatherData.current.wind_speed_10m;

    // Interpret weather code
    const weatherCondition = getWeatherCondition(weatherCode);

    weatherEl.textContent = `Weather: ${weatherCondition}, ${temp}°F, Wind: ${windSpeed} mph`;

    // Analyze mood based on weather
    const mood = analyzeMood(temp, weatherCode, windSpeed);
    moodEl.textContent = `Suggested Mood: ${mood}`;

    // Save to Firestore
    await saveCheckIn(temp, weatherCondition, mood);

    statusEl.textContent = 'Mood saved!';

  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    console.error(error);
  }
}

// Get weather condition from code
function getWeatherCondition(code) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

// Analyze mood based on weather conditions
function analyzeMood(temp, weatherCode, windSpeed) {
  let mood = 'Neutral';

  // Temperature effects
  if (temp >= 65 && temp <= 75) {
    mood = 'Pleasant';
  } else if (temp < 40 || temp > 85) {
    mood = 'Uncomfortable';
  }

  // Weather condition effects
  if (weatherCode === 0) {
    mood = 'Bright and Positive';
  } else if (weatherCode >= 61 && weatherCode <= 65) {
    mood = 'Cozy and Reflective';
  } else if (weatherCode >= 80) {
    mood = 'Gloomy';
  }

  // Wind effects
  if (windSpeed > 20) {
    mood += ' (Windy and Restless)';
  }

  return mood;
}

// Save check-in to Firestore
async function saveCheckIn(temperature, weather, mood) {
  const user = auth.currentUser;
  if (!user) return;

  await db.collection('checkins').add({
    uid: user.uid,
    temperature,
    weather,
    mood,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}
