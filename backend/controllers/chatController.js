const Groq = require("groq-sdk");
const Resume = require("../models/Resume");

// Groq SDK setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Chatbot functionality jo resume text padh ke advice dega
exports.chat = async (req, res) => {
  try {
    const { message, resumeId, analysisContext } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    let resumeSnippet = "";
    // Agar resumeId mili hai to usme se kuch text nikalna AI ke context ke liye
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
      if (resume) resumeSnippet = resume.rawText.slice(0, 800);
    }

    const systemPrompt = `You are a friendly expert career coach AI.
${resumeSnippet ? `User's resume snippet: ${resumeSnippet}` : ""}
${analysisContext ? `Current analysis: ATS Score: ${analysisContext.atsScore}, JD Match: ${analysisContext.jdMatch}%, Missing: ${(analysisContext.missingKeywords || []).join(", ")}` : ""}
Give short, actionable, encouraging advice. Be specific. 2-4 sentences max.`;

    // Groq AI API call karke response lana
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";
    // User ko bot ka jawab bhejna
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};