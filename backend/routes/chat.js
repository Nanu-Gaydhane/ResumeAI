const router  = require("express").Router();
const protect = require("../middleware/auth");
const { chat } = require("../controllers/chatController");

// AI chatbot API endpoint - user ke resume related questions ke liye
router.post("/", protect, chat);

module.exports = router;
