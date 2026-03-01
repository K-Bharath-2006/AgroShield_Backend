const axios = require("axios");
const FormData = require("form-data");

exports.getAIResult = async (damageImages) => {
  try {
    const formData = new FormData();

    damageImages.forEach((img, index) => {
      formData.append("files", img.data, {
        filename: `image_${index}.jpg`,
        contentType: img.contentType,
      });
    });

    const response = await axios.post(
      "http://localhost:8002/predict",
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return {
      confidence: response.data.finalConfidence / 100,
      raw: response.data,
    };

  } catch (error) {
    console.error("AI Service Error:", error.message);
    return { confidence: 0 };
  }
};