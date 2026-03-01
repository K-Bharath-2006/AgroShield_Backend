const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    profilePicture: String,

    phoneNumber: String,
    district: String,
    taluk: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);