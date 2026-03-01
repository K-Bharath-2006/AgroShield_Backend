const CropRegistration = require("../models/CropRegistration");
const Claim = require("../models/Claim");

exports.createCrop = async (req, res) => {
  try {
    const {
      cropType,
      season,
      landAreaHectare,
      sowingDate,
    } = req.body;

    // 🔥 Parse GeoJSON location
    const location = JSON.parse(req.body.location);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
      });
    }

    // Convert uploaded images to Buffer
    const imageData = req.files.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    }));

    const newCrop = await CropRegistration.create({
      user: req.user.id,
      cropType,
      season,
      landAreaHectare: parseFloat(landAreaHectare),
      sowingDate,
      location: location,
      baselineImages: imageData,
    });

    res.status(201).json({
      success: true,
      message: "Crop registered successfully",
      data: newCrop,
    });

  } catch (error) {
    console.error("Crop creation error:", error);
    res.status(500).json({ message: error.message });
  }
};



// ✅ Get All Crops
exports.getMyCrops = async (req, res) => {
  try {
    const crops = await CropRegistration.find({
      user: req.user.id,
    }).select("-baselineImages.data") // 🔥 exclude heavy image data

    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: crops.length,
      data: crops,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// ✅ Get Single Crop (with claim status)
exports.getSingleCrop = async (req, res) => {
  try {
    const crop = await CropRegistration.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found",
      });
    }

    // 🔥 Check if claim already exists
    const existingClaim = await Claim.findOne({
      crop: crop._id,
      user: req.user.id,
    }).select("-damageImages.data");

    const cropObj = crop.toObject();

    // Convert images to base64
    cropObj.baselineImages = cropObj.baselineImages.map(img => ({
      contentType: img.contentType,
      data: img.data.toString("base64"),
    }));

    // 🔥 Add claim flag
    cropObj.claimAlreadyRaised = existingClaim ? true : false;

    // Optional: send claim id also
    cropObj.claimId = existingClaim ? existingClaim._id : null;

    res.status(200).json({
      success: true,
      data: cropObj,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};