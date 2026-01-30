let currentWeather = null;
let currentMood = null;
let currentLocation = null;

const WEATHER_API_KEY = "a7a2f6fb8e60879aa1cc5a86699cb111";

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

const authDiv = document.getElementById("auth");
const appDiv = document.getElementById("app");
const userP = document.getElementById("user");
const list = document.getElementById("checkins");

auth.onAuthStateChanged(user => {
  if (user) {
    authDiv.style.display = "none";
    appDiv.style.display = "block";
    userP.innerText = `Logged in as ${user.email}`;
    loadCheckins();
  } else {
    authDiv.style.display = "block";
    appDiv.style.display = "none";
  }
});

function login() {
  const emailInput = document.getElementById("email").value;
  const passwordInput = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(emailInput, passwordInput)
    .catch(() => {
      auth.createUserWithEmailAndPassword(emailInput, passwordInput);
    });
}

function logout() {
  auth.signOut();
}

async function fetchWeather() {
  const status = document.getElementById("status");
  const weatherP = document.getElementById("weather");
  const moodP = document.getElementById("mood");

  status.innerText = "Getting location...";

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    currentLocation = { lat: latitude, lon: longitude };

    status.innerText = "Fetching weather...";

    const data = await getWeather(latitude, longitude);

    if (!data || !data.weather) {
      status.innerText = "Weather unavailable.";
      return;
    }

    const main = data.weather[0].main;
    const temp = data.main.temp;

    currentWeather = main;
    currentMood = getMoodFromWeather(main);

    weatherP.innerText = `Weather: ${main}, ${temp}°C`;
    moodP.innerText = `Your Mood today: ${currentMood}`;
    status.innerText = "Weather fetched.";
  },
  () => {
    status.innerText = "Location permission denied.";
  });
}


async function submitCheckin() {
  const status = document.getElementById("status");
  status.innerText = "Getting location...";

  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    status.innerText = "Fetching weather...";

    const weatherData = await getWeather(latitude, longitude);

    let weatherMain = "Unknown";
    let mood = "🤷 Unknown";

    if (weatherData && weatherData.weather && weatherData.weather.length > 0) {
      weatherMain = weatherData.weather[0].main;
      mood = getMoodFromWeather(weatherMain);
    } else {
      status.innerText = "Weather unavailable, saving anyway...";
    }

    const user = auth.currentUser;

    await db.collection("checkins").add({
      uid: user.uid,
      text: message.value,
      mood: mood,
      weather: weatherMain,
      location: { lat: latitude, lon: longitude },
      timestamp: new Date()
    });

    status.innerText = `Saved! Mood: ${mood}`;
    message.value = "";
  },
  () => {
    status.innerText = "Location permission denied.";
  });

  console.log("Lat:", latitude, "Lon:", longitude);
}


function loadCheckins() {
  const user = auth.currentUser;

  
  db.collection("checkins")
    .where("uid", "==", user.uid)
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.innerText = `${doc.data().mood} (${doc.data().weather}) — ${doc.data().text}`;

        list.appendChild(li);
      });
    });
}


function getMoodFromWeather(main) {
  switch (main) {
    case "Clear": return "😊 Happy";
    case "Clouds": return "🙂 Neutral";
    case "Rain":
    case "Drizzle": return "😐 Meh";
    case "Thunderstorm": return "😟 Stressed";
    case "Snow": return "😌 Calm";
    default: return "🤷 Unknown";
  }
}

async function getWeather(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}


async function saveCheckin() {
  if (!currentWeather || !currentMood) {
    alert("Fetch weather first!");
    return;
  }

  const user = auth.currentUser;

  await db.collection("checkins").add({
    uid: user.uid,
    weather: currentWeather,
    mood: currentMood,
    note: message.value,
    location: currentLocation,
    timestamp: new Date()
  });

  status.innerText = "Check-in saved!";
  message.value = "";
}

