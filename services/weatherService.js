const axios = require("axios");

exports.getTodayWeather = async (lat, lon) => {
  const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: lat,
      longitude: lon,
      current_weather: true,
      daily: "precipitation_sum",
      timezone: "auto",
    },
  });

  const data = response.data;

  const current = data.current_weather;
  const todayRainfall = data.daily?.precipitation_sum?.[0] || 0;

  // Weather condition logic
  let condition = "Clear";
  if (current.weathercode >= 0 && current.weathercode <= 1) {
    condition = "Sunny";
  } else if (current.weathercode >= 2 && current.weathercode <= 3) {
    condition = "Cloudy";
  } else if (current.weathercode >= 51) {
    condition = "Rain";
  }

  // Alert logic
  let alert = null;

  if (todayRainfall > 50) {
    alert = "Heavy Rain Alert";
  } else if (current.temperature > 40) {
    alert = "Heat Wave Alert";
  } else if (todayRainfall > 10) {
    alert = "Moderate Rain Expected";
  } else if (todayRainfall > 0) {
    alert = "Light Rainfall";
  } else {
    alert = null; // No risk
  }

  return {
    temperature: current.temperature,
    rainfall_mm: todayRainfall,
    condition,
    alert,
  };
};

exports.getWeatherData = async (lat, lon, damageDate) => {
  try {
    // 🔒 Validate inputs
    if (!lat || !lon || !damageDate) {
      throw new Error("Invalid weather input parameters");
    }

    const damage = new Date(damageDate);

    if (isNaN(damage.getTime())) {
      throw new Error("Invalid damage date");
    }

    const startDate = new Date(damage);
    startDate.setDate(startDate.getDate() - 2);

    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const start = formatDate(startDate);
    const end = formatDate(damage);

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.daily) {
      throw new Error("Weather archive unavailable");
    }

    // console.log("Weather API Response:", data.daily);

    // 🔒 Remove null/invalid values safely
    const rainfallArray = (data.daily.precipitation_sum || []).filter(
      (v) => typeof v === "number" && !isNaN(v)
    );

    const tempMaxArray = (data.daily.temperature_2m_max || []).filter(
      (v) => typeof v === "number" && !isNaN(v)
    );

    const tempMinArray = (data.daily.temperature_2m_min || []).filter(
      (v) => typeof v === "number" && !isNaN(v)
    );

    // 🔥 Safe fallback calculations
    const totalRainfall =
      rainfallArray.length > 0
        ? rainfallArray.reduce((sum, val) => sum + val, 0)
        : 0;

    const maxTemp =
      tempMaxArray.length > 0
        ? Math.max(...tempMaxArray)
        : 0;

    const minTemp =
      tempMinArray.length > 0
        ? Math.min(...tempMinArray)
        : 0;

    // 🔐 Final Safe Casting (NO NaN possible)
    const safeRainfall = Number.isFinite(totalRainfall)
      ? Number(totalRainfall)
      : 0;

    const safeMaxTemp = Number.isFinite(maxTemp)
      ? Number(maxTemp)
      : 0;

    const safeMinTemp = Number.isFinite(minTemp)
      ? Number(minTemp)
      : 0;

    // 🌪 Extreme event logic
    const extremeEventDetected =
      safeRainfall > 50 ||
      safeMaxTemp > 40 ||
      safeMinTemp < 5;

    return {
      rainfall_mm: safeRainfall,
      temperatureMax: safeMaxTemp,
      temperatureMin: safeMinTemp,
      extremeEventDetected,
    };

  } catch (error) {
    console.error("Historical Weather Error:", error.message);
    return {
      rainfall_mm: 0,
      temperatureMax: 0,
      temperatureMin: 0,
      extremeEventDetected: false,
    };
  }
};