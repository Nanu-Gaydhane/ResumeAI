const router  = require("express").Router();
const protect = require("../middleware/auth");
const { analyze, generate } = require("../controllers/analyzeController");

// Resume analysis API endpoints
router.post("/",          protect, analyze);  // Resume aur JD compare karne ke liye
router.post("/generate",  protect, generate); // Naya optimized resume text generate karne ke liye

module.exports = router;
