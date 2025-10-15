const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/users");

// ---------------- Signup ----------------
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, phone, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.trim() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user (password will be hashed automatically)
    const user = new User({
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone?.trim(),
      role: role || "user",
    });

    await user.save();

    // Return user data without password
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({
      message: "Signin Successful",  // ✅ matches frontend check
      user: userData,
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Signin ----------------
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Signin Successful",  // ✅ matches frontend check
      user: userData,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
