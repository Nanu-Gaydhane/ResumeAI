const mongoose = require("mongoose");

// Analysis schema - resume aur job description ka compare result save karne ke liye
const analysisSchema = new mongoose.Schema({
  jdText:          String,
  atsScore:        Number,
  skillsMatch:     Number,
  experienceMatch: Number,
  projectsMatch:   Number,
  missingKeywords: [String],
  presentKeywords: [String],
  suggestions:     [String],
  sectionFeedback: {
    skills: [String],
    experience: [String],
    projects: [String],
    education: [String],
  },
  createdAt:       { type: Date, default: Date.now },
});

// Resume schema - user ka uploaded resume data store karne ke liye
const resumeSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName:      String,
  rawText:       { type: String, required: true },
  analyses:      [analysisSchema],
  optimizedResumes: [{ text: String, createdAt: { type: Date, default: Date.now } }],
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", resumeSchema);
