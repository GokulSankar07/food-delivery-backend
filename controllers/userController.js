const bcrypt = require("bcryptjs");
const User = require("../models/users");
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const emailNormalized = email.trim().toLowerCase(); // normalize email
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Signin Successful",
      user: userData,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
