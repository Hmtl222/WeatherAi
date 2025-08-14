// Подключение Open-Meteo API
async function geocodeCity(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ru&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ошибка геокодинга");
  const data = await res.json();
  if (!data.results?.length) throw new Error("Город не найден");
  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, label: `${name}, ${country}` };
}

async function getWeather({ latitude, longitude }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ошибка прогноза");
  return res.json();
}

// Маппинг кодов погоды
function describeWeather(code) {
  if (code === 0) return "Ясно";
  if ([1,2,3].includes(code)) return "Переменная облачность";
  if ([45,48].includes(code)) return "Туман";
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return "Дождь";
  if ([71,73,75,77,85,86].includes(code)) return "Снег";
  return "Облачно";
}

// UI элементы
const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const btnGeo = document.getElementById("btnGeo");
const alertBox = document.getElementById("alertBox");

const placeLabel = document.getElementById("placeLabel");
const asOf = document.getElementById("asOf");
const tempNow = document.getElementById("tempNow");
const descNow = document.getElementById("descNow");
const windNow = document.getElementById("windNow");
const tempMin = document.getElementById("tempMin");
const tempMax = document.getElementById("tempMax");

function showAlert(msg, type="danger") {
  alertBox.className = `alert alert-${type} mt-3`;
  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
}

function clearAlert() {
  alertBox.classList.add("d-none");
}

async function loadWeather(cityName) {
  try {
    clearAlert();
    const where = await geocodeCity(cityName);
    const data = await getWeather(where);

    placeLabel.textContent = where.label;
    asOf.textContent = new Date().toLocaleString();
    tempNow.textContent = `${Math.round(data.current.temperature_2m)}°C`;
    descNow.textContent = describeWeather(data.current.weather_code);
    windNow.textContent = data.current.wind_speed_10m;
    tempMin.textContent = `${Math.round(data.daily.temperature_2m_min[0])}°C`;
    tempMax.textContent = `${Math.round(data.daily.temperature_2m_max[0])}°C`;

    document.querySelectorAll(".fade-up").forEach(el => el.classList.add("show"));
  } catch (e) {
    showAlert(e.message);
  }
}

// Поиск по форме
form.addEventListener("submit", e => {
  e.preventDefault();
  loadWeather(input.value);
});

// Местоположение
btnGeo.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showAlert("Геолокация не поддерживается");
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      clearAlert();
      const { latitude, longitude } = pos.coords;
      const data = await getWeather({ latitude, longitude });
      placeLabel.textContent = "Ваше местоположение";
      asOf.textContent = new Date().toLocaleString();
      tempNow.textContent = `${Math.round(data.current.temperature_2m)}°C`;
      descNow.textContent = describeWeather(data.current.weather_code);
      windNow.textContent = data.current.wind_speed_10m;
      tempMin.textContent = `${Math.round(data.daily.temperature_2m_min[0])}°C`;
      tempMax.textContent = `${Math.round(data.daily.temperature_2m_max[0])}°C`;
      document.querySelectorAll(".fade-up").forEach(el => el.classList.add("show"));
    } catch (e) {
      showAlert(e.message);
    }
  }, () => showAlert("Не удалось получить геопозицию"));
});

// Загрузка по умолчанию (Баку)
loadWeather("Баку");
