// Express aur zaroori packages import kar rahe hain
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./utils/db");

// Environment variables load karna
dotenv.config();

// MongoDB database se connect karna
connectDB();

const app = express();

// Middleware setup: CORS aur JSON parsing enable kar rahe hain
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// API Routes ko register kar rahe hain
app.use("/api/auth",   require("./routes/auth"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/analyze",require("./routes/analyze"));
app.use("/api/chat",   require("./routes/chat"));

// Basic health check route
app.get("/", (req, res) => res.json({ message: "Resume-AI API running ✅" }));

const PORT = process.env.PORT || 5000;

// Server start karna aur port busy hone par next port try karna
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} busy, trying ${PORT + 1}...`);
    app.listen(PORT + 1, () => console.log(`Server running on port ${PORT + 1}`));
  }
});