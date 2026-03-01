const { getTodayWeather } = require("../services/weatherService");

exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const weather = await getTodayWeather(lat, lon);

    res.status(200).json({
      success: true,
      data: weather,
    });

  } catch (error) {
    console.error("Weather API Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weather data",
    });
  }
};