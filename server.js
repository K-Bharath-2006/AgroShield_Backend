require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Image too large. Max 8MB allowed.',
    });
  }
  next(err);
}); 

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/crops",require("./routes/cropRoutes"));
app.use("/api/claims",require("./routes/claimRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));

app.get("/", (req, res) => {
  res.send("Agro Shield API Running...");
});

const PORT = process.env.PORT || 3040;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});