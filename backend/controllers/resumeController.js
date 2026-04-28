const pdfParse = require("pdf-parse");
const Resume   = require("../models/Resume");

// POST /api/resume/upload - File (PDF/TXT) upload karne ke liye
exports.upload = async (req, res) => {
  try {
    // Agar file na aaye to error do
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let rawText = "";
    // Agar file PDF hai, to pdf-parse library use karke text nikalna
    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(req.file.buffer);
      rawText = parsed.text;
    } else {
      // Agar text file hai to seedha string me convert karna
      rawText = req.file.buffer.toString("utf-8");
    }

    // Ek se zyada spaces hatana taaki clean text mile
    rawText = rawText.replace(/\s+/g, " ").trim();
    if (!rawText) return res.status(400).json({ message: "Could not extract text from file" });

    const resume = await Resume.create({
      userId:   req.user.id,
      fileName: req.file.originalname,
      rawText,
    });

    res.status(201).json({ resumeId: resume._id, fileName: resume.fileName, textLength: rawText.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/resume/text - User khud text copy-paste kare to ye API chalegi
exports.saveText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "No text provided" });

    // Paste ki hui text ka naya resume DB me banana
    const resume = await Resume.create({
      userId:   req.user.id,
      fileName: "pasted-resume.txt",
      rawText:  text.trim(),
    });

    res.status(201).json({ resumeId: resume._id, textLength: text.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/resume - User ki saari purani uploaded resumes ki list paane ke liye
exports.getAll = async (req, res) => {
  try {
    // Current user id ke basis par search
    const resumes = await Resume.find({ userId: req.user.id })
      .select("fileName createdAt analyses")
      .sort("-createdAt"); // Latest resume upar
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/resume/:id - Ek specific resume ki details (analysis, score, etc.) nikalna
exports.getOne = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
