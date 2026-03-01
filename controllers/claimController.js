const Claim = require("../models/Claim");
const Crop = require("../models/CropRegistration");

const { getWeatherData } = require("../services/weatherService");
const { getNDVIData } = require("../services/ndviService");
const { getAIResult } = require("../services/aiService");
const { calculateRiskScore } = require("../services/riskScoreService");
const {getDistanceInMeters} = require("../utils/distance")

exports.raiseClaim = async (req, res) => {
  try {
    const { cropId, damageType, description, damageDate } = req.body;
    const location = JSON.parse(req.body.location);

    const claimLatitude = location.coordinates[1];
    const claimLongitude = location.coordinates[0];
    
    /* ================= VALIDATIONS ================= */
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one damage image is required",
      });
    }

    if (!damageDate) {
      return res.status(400).json({
        message: "Damage date is required",
      });
    }
    if(!claimLatitude || !claimLongitude){
      return res.status(400).json({
        message : "Claim Location is Required",
      });
    }
    const crop = await Crop.findById(cropId);

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    // Prevent duplicate claim
    const existing = await Claim.findOne({
      crop: cropId,
      user: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        message: "Claim already raised for this crop",
      });
    }

    const cropLat = crop.location.coordinates[1];
    const cropLon = crop.location.coordinates[0];

    const area_m2 = crop.landAreaHectare * 10000;
    const radius = Math.sqrt(area_m2 / Math.PI);
    const tolerance = 20;

    const distance = getDistanceInMeters(
      cropLat,
      cropLon,
      Number(claimLatitude),
      Number(claimLongitude)
    );

    if (distance > radius + tolerance) {
      return res.status(400).json({
        message: "Claim location is outside registered crop boundary",
      });
    }

    /* ================= PREPARE DATA ================= */

    const claimNumber = `CLM-${Date.now()}`;

    const latitude = crop.location.coordinates[1];
    const longitude = crop.location.coordinates[0];
    const hectare = crop.landAreaHectare;

    const imageData = req.files.map((file) => ({
      data: file.buffer,
      contentType: file.mimetype,
    }));

    /* ================= CREATE CLAIM (INITIAL SAVE) ================= */

    const claim = await Claim.create({
      claimNumber,
      crop: cropId,
      user: req.user.id,
      damageDate,
      description,
      damageType,
      location: crop.location,
      damageImages: imageData,
      stage: "Submitted",
      timeline: [
        {
          status: "Submitted",
          note: "Claim submitted by farmer",
        },
      ],
    });

    /* ================= AUTO ANALYSIS ================= */

    const weather = await getWeatherData(latitude, longitude, damageDate);

    const ndvi = await getNDVIData(
      latitude,
      longitude,
      damageDate,
      hectare
    );

    const ai = await getAIResult(claim.damageImages);

    /* ================= SAFE FALLBACKS ================= */

    const safeWeather = {
      rainfall: weather?.rainfall_mm || 0,
      temperatureMax: weather?.temperatureMax || 0,
      temperatureMin: weather?.temperatureMin || 0,
      extremeEventDetected: weather?.extremeEventDetected || false,
    };

    const safeNDVI = {
      before: ndvi?.before || 0,
      after: ndvi?.after || 0,
      drop: ndvi?.dropPercent || 0,
      beforeHeatmapUrl: ndvi?.beforeHeatmapUrl || null,
      afterHeatmapUrl: ndvi?.afterHeatmapUrl || null,
    };

    const safeAI = {
      confidence: ai?.confidence || 0,
    };

    /* ================= RISK CALCULATION ================= */

    const risk = calculateRiskScore({
      rainfall: safeWeather.rainfall,
      temperatureMax: safeWeather.temperatureMax,
      temperatureMin: safeWeather.temperatureMin,
      ndviBefore: safeNDVI.before,
      ndviAfter: safeNDVI.after,
      aiConfidence: safeAI.confidence,
      damageType,
      isHighRiskZone: true,
    });

    /* ================= UPDATE CLAIM ================= */

    claim.weatherAnalysis = {
      rainfall: safeWeather.rainfall,
      temperatureMax: safeWeather.temperatureMax,
      temperatureMin: safeWeather.temperatureMin,
      extremeEventDetected: safeWeather.extremeEventDetected,
    };

    claim.satelliteAnalysis = {
      ndviBefore: safeNDVI.before,
      ndviAfter: safeNDVI.after,
      ndviDrop: safeNDVI.drop,
      beforeHeatmapUrl: safeNDVI.beforeHeatmapUrl,
      afterHeatmapUrl: safeNDVI.afterHeatmapUrl,
    };

    claim.aiDamageScore = safeAI.confidence * 100;

    claim.riskScore = risk?.totalScore || 0;

    claim.fieldInspectionRequired =
      (risk?.totalScore || 0) < 50;

    claim.stage = "Auto-Analyzed";

    claim.timeline.push({
      status: "Auto-Analyzed",
      note: `Risk Score Calculated: ${risk?.totalScore || 0}`,
    });

    await claim.save();

    /* ================= RESPONSE ================= */

    res.status(201).json({
      success: true,
      message: "Claim submitted and auto-analyzed successfully",
      data: claim,
    });

  } catch (error) {
    console.error("Claim Error:", error);
    res.status(500).json({
      message: "Claim processing failed",
      error: error.message,
    });
  }
};

// ✅ Get All Claims (Optimized for List View)
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({
      user: req.user.id,
    })
      .select(
        "claimNumber damageType stage status riskScore createdAt"
      )
      .populate("crop", "cropType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSingleClaim = async (req, res) => {
  try {
    const claim = await Claim.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .select("-damageImages.data")
      .populate({
        path: "crop",
        select: "-baselineImages.data", // 🔥 VERY IMPORTANT
      });

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      data: claim,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};