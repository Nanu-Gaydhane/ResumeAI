const router = require("express").Router();
const { signup, login, me } = require("../controllers/authController");
const protect = require("../middleware/auth");

// Authentication ke API endpoints
router.post("/signup", signup); // Naya user register karne ke liye
router.post("/login",  login);  // Existing user login karne ke liye
router.get("/me",      protect, me); // Logged-in user ki details paane ke liye

module.exports = router;
