const router  = require("express").Router();
const multer  = require("multer");
const protect = require("../middleware/auth");
const { upload, saveText, getAll, getOne } = require("../controllers/resumeController");

// File upload setup using multer (Sirf PDF/TXT allow, max 5MB)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (["application/pdf", "text/plain"].includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF and TXT files allowed"), false);
};
const uploader = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Resume management API endpoints
router.post("/upload", protect, uploader.single("resume"), upload); // File upload API
router.post("/text",   protect, saveText); // Direct text save API
router.get("/",        protect, getAll);   // User ke sabhi resumes list karne ke liye
router.get("/:id",     protect, getOne);   // Specific resume ki details nikalne ke liye

module.exports = router;
