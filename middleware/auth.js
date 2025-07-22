const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token not found. Please login." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "dflfdkjreiwreriovnxvmnvxcm@#12fdfre#");

    req.user = decoded; 
    next();
  } catch (err) {
    console.error("JWT Auth Error:", err);
    return res.status(401).json({ error: "Unauthorized user | Invalid or expired token" });
  }
};

module.exports = { auth };
