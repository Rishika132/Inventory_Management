const jwt = require ("jsonwebtoken");

// Middleware to verify JWT token from Authorization header
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token not found. Please login." });
    }

    const token = authHeader.split(" ")[1]; // Get actual token part

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    console.error("JWT Auth Error:", err);
    return res.status(401).json({ error: "Unauthorized user | Invalid or expired token" });
  }
};

module.exports = { auth };