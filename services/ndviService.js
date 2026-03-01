const axios = require("axios");

exports.getNDVIData = async (lat, lon, damageDate,landAreaHectare) => {
  try {
    const response = await axios.get(
      "http://localhost:8001/ndvi",
      {
        params: {
          lat,
          lon,
          damage_date: damageDate,
          hectare : landAreaHectare,
        },
      }
    );

    return response.data;

  } catch (error) {
    console.error("NDVI Service Error:", error.message);

    return {
      before: 0,
      after: 0,
      dropPercent: 0,
    };
  }
};