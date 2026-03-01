const express = require("express");
const router = express.Router();
const cropController = require("../controllers/cropController");
const {protect} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, upload.array("images", 5),cropController.createCrop);
router.get("/", protect, cropController.getMyCrops);
router.get("/:id", protect, cropController.getSingleCrop);

module.exports = router;