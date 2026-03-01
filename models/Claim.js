const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    // 🔢 Human-readable Claim ID
    claimNumber: {
      type: String,
      unique: true,
    },

    // 🔗 Reference to Crop
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropRegistration",
      required: true,
    },

    // 🔗 Reference to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📅 Damage Date
    damageDate: {
      type: Date,
      required: true,
    },

    // 📝 Description from Farmer
    description: {
      type: String,
      required: true,
    },

    // ⚠ Type of Damage
    damageType: {
      type: String,
      enum: [
        "Natural Fire",
        "Lightning",
        "Storm",
        "Hailstorm",
        "Cyclone",
        "Typhoon",
        "Tempest",
        "Hurricane",
        "Tornado",
        "Flood",
        "Inundation",
        "Landslide",
        "Drought",
        "Dry spells",
        "Pests",
        "Diseases",
      ],
      required: true,
    },

    // 📍 Geo Location
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

    // 📸 Damage Images
    damageImages: [
      {
        data: Buffer,
        contentType: String,
      },
    ],

    // 🌦 Weather Analysis
    weatherAnalysis: {
      rainfall: Number,
      temperatureMax: Number,
      temperatureMin: Number,
      extremeEventDetected: Boolean,
    },

    // 🛰 Satellite Analysis
    satelliteAnalysis: {
      ndviBefore: Number,
      ndviAfter: Number,
      ndviDrop: Number,
      beforeHeatmapUrl: String,
      afterHeatmapUrl: String,
    },

    // 🤖 AI Score
    aiDamageScore: {
      type: Number,
    },

    // 📊 Final Risk Score
    riskScore: {
      type: Number,
    },

    // 🚩 Whether manual inspection needed
    fieldInspectionRequired: {
      type: Boolean,
      default: false,
    },
    // 📌 Claim Stage (Process Tracking)
    stage: {
      type: String,
      enum: [
        "Submitted",
        "Auto-Analyzed",
        "Under Review",
        "Inspection Required",
        "Approved",
        "Rejected",
        "Paid",
      ],
      default: "Submitted",
    },

    // 🕒 Timeline Log (Audit Trail)
    timeline: [
      {
        status: String,
        date: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    // 📄 Generated Report
    report: {
      type: String,
    },

    // 🏢 Final Decision
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// 🌍 Geo index
claimSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Claim", claimSchema);
