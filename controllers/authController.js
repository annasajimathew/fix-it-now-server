const User = require("../models/userModel")
const jwt = require("jsonwebtoken")

// LOGIN
exports.login = async (req, res) => {
  try {
    // 🔥 TRIM INPUTS
    const email = req.body.email.trim()
    const password = req.body.password.trim()

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

// REGISTER
exports.register = async (req, res) => {
  try {
    const name = req.body.name.trim()
    const email = req.body.email.trim()
    const password = req.body.password.trim()
    const role = req.body.role || "user"
    const service = req.body.service || ""

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      service,
    })

    res.status(201).json({ message: "User registered", user })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
