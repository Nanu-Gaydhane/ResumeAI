const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

// JWT token generate karne ka function (7 din ki validity ke sath)
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });

// POST /api/auth/signup - Naya user register karna
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check karna agar koi field miss hai
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    // Check karna agar user pehle se exist karta hai
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    // Password ko hash karna security ke liye
    const hashed = await bcrypt.hash(password, 12);
    
    // Naya user create karna database me
    const user   = await User.create({ name, email, password: hashed });

    // Response me token aur user details bhejna
    res.status(201).json({
      token: generateToken(user._id),
      user:  { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login - Existing user ko login karwana
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    // Email se user dhundna
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Hashed password match karna
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Login success, token generate karke dena
    res.json({
      token: generateToken(user._id),
      user:  { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me - Current logged-in user ki details paana
exports.me = async (req, res) => {
  try {
    // Password field ko chhod kar baaki user data nikalna
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};