const multer = require("multer");

const storage = multer.memoryStorage(); // store in memory as Buffer

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

module.exports = upload;