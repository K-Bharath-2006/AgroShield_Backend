const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  raiseClaim,
  getMyClaims,
  getSingleClaim,
} = require("../controllers/claimController");

router.get("/my", protect, getMyClaims);

// Get single claim details
router.get("/:id", protect, getSingleClaim);

// Farmer raises claim
router.post("/raise", protect, upload.array("images", 5), raiseClaim);

module.exports = router;
