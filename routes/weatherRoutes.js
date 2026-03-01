const express = require("express");
const router = express.Router();
const weatherController = require("../controllers/weatherController");
const { protect } = require("../middleware/authMiddleware");

router.get("/today", protect, weatherController.getCurrentWeather);

module.exports = router;