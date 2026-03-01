const mongoose = require("mongoose");

const cropRegistrationSchema = new mongoose.Schema(
  {
    // 🔗 Link to User (Farmer)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropType: {
      type: String,
      required: true,
      trim: true,
    },

    season: {
      type: String,
      required: true,
      enum: ["Kharif", "Rabi", "Zaid", "Samba", "Kuruvai", "Navarai"],
    },

    landAreaHectare: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // 🌍 GeoJSON location (important for satellite + weather)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    sowingDate: {
      type: Date,
      required: true,
    },

    expectedHarvestDate: {
      type: Date,
    },

    baselineImages: [
      {
        data: Buffer,
        contentType: String,
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "HARVESTED", "CLAIMED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

// 🌍 Enable Geo Queries
cropRegistrationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("CropRegistration", cropRegistrationSchema);
