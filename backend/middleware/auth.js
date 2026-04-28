const jwt = require("jsonwebtoken");

// Token verify karne ka middleware, taaki sirf logged-in user API access kar sake
module.exports = (req, res, next) => {
  // Request header se token nikalna
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, access denied" });

  try {
    // Token verify karna aur user details request object me set karna
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
