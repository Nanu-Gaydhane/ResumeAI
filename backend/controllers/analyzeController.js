const Groq = require("groq-sdk");
const Resume = require("../models/Resume");

// Groq API initialize kar rahe hain AI models call karne ke liye
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Resume ko Job Description ke saath compare karke score nikalna
exports.analyze = async (req, res) => {
  try {
    const { resumeId, jdText } = req.body;
    if (!resumeId || !jdText)
      return res.status(400).json({ message: "resumeId and jdText required" });

    // User ka resume database se nikalna
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS resume analyzer. Respond ONLY with valid JSON, no markdown, no preamble.",
        },
        {
          role: "user",
          content: `Analyze this resume against the job description.

RESUME:
${resume.rawText.slice(0, 3000)}

JOB DESCRIPTION:
${jdText.slice(0, 1500)}

Return exactly this JSON:
{
  "atsScore": <0-100>,
  "skillsMatch": <0-100>,
  "experienceMatch": <0-100>,
  "projectsMatch": <0-100>,
  "missingKeywords": ["..."],
  "presentKeywords": ["..."],
  "suggestions": ["..."],
  "sectionFeedback": {
    "skills": ["..."],
    "experience": ["..."],
    "projects": ["..."],
    "education": ["..."]
  }
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    let text = "";
    try {
      // AI se jo response aaya use extract karna
      text = completion.choices[0]?.message?.content || "";
      // Agar JSON markdown formatting ke saath aaya hai to backticks hatana
      const jsonStr = text.replace(/```json|```/g, "").trim();
      
      // JSON format ko parse karna
      const analysisData = JSON.parse(jsonStr);

      // Parse kiya hua data resume me save karna
      resume.analyses.push({ jdText, ...analysisData });
      await resume.save();

      // Frontend ko result bhejna
      res.json(analysisData);
    } catch (parseErr) {
      require("fs").writeFileSync("debug_llm_error.txt", "PARSE ERROR: " + parseErr.message + "\n\nRAW TEXT:\n" + text);
      res.status(500).json({ message: "Failed to parse AI response. " + parseErr.message });
    }
  } catch (err) {
    require("fs").writeFileSync("debug_server_error.txt", err.stack);
    res.status(500).json({ message: err.message });
  }
};

// AI ka use karke resume text ko optimize (improve) karna missing keywords add karke
exports.generate = async (req, res) => {
  try {
    const { resumeId, jdText, missingKeywords = [] } = req.body;
    if (!resumeId || !jdText)
      return res.status(400).json({ message: "resumeId and jdText required" });

    // Resume find karna
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert ATS Resume Optimizer.

Your task is to improve an existing resume based on a given Job Description.

IMPORTANT RULES:
- Do NOT change the structure, formatting, or section headings.
- Do NOT add new sections.
- Only enhance the existing content.
- Keep the tone professional and concise.
- Maintain bullet points where they already exist.
- Do not increase length unnecessarily.

WHAT TO DO:
1. Add relevant keywords from the Job Description naturally.
2. Improve action verbs (e.g., "made" → "developed", "worked on" → "implemented").
3. Make bullet points more impactful using measurable results if possible.
4. Optimize content for ATS (Applicant Tracking System).
5. Keep the meaning same, just improve wording.

OUTPUT FORMAT:
Return ONLY the improved resume text.
Do not add explanations.
Do not change formatting.`,
        },
        {
          role: "user",
          content: `INPUT:
Resume Content:
${resume.rawText.slice(0, 3000)}

Job Description:
${jdText.slice(0, 1500)}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    // AI response nikalna
    let optimizedText = completion.choices[0]?.message?.content?.trim() || "";
    // HTML tags jo AI markdown me deta hai usko remove karna
    optimizedText = optimizedText.replace(/```html|```/g, "").trim();

    // Naya optimized resume DB me save karna
    resume.optimizedResumes.push({ text: optimizedText });
    await resume.save();

    res.json({ optimizedText });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};