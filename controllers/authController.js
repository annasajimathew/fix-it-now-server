const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      service,
      phone,
      experience,
      languages,
      education,
      location
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (role === "worker") {
      if (!service || !phone || !location) {
        return res.status(400).json({
          message: "Worker must provide service, phone & location"
        });
      }

      if (!req.files?.profileImage || !req.files?.idProof) {
        return res.status(400).json({
          message: "Worker must upload profile image & ID proof"
        });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,

      service: role === "worker" ? service : "",
      phone: role === "worker" ? phone : "",
      location: role === "worker" ? location : "",
      experience: role === "worker" ? experience : 0,
      languages:
        role === "worker" && languages ? JSON.parse(languages) : [],
      education: role === "worker" ? education : "",

      profileImage:
        req.files?.profileImage?.[0]?.path || "",

      idProof:
        role === "worker"
          ? req.files?.idProof?.[0]?.path || ""
          : "",

      isApproved: role !== "worker"
    });

    res.status(201).json({
      message: "Registered successfully",
      user
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};


// ================= LOGIN =================
// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // ✅ IMPORTANT FIX HERE
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "worker" && !user.isApproved) {
      return res.status(403).json({ message: "Worker not approved yet" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ❌ hide password before sending
    user.password = undefined;

    res.json({ token, user });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
