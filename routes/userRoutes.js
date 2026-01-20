const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/multerMiddleware.js");
const bcrypt = require("bcryptjs");

/* =====================================================
   UPDATE USER PROFILE (NAME + IMAGE ONLY)
===================================================== */
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (req.user.role !== "user") {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Name editable
      user.name = req.body.name || user.name;

      // ❌ Email NOT editable (fixed)

      if (req.file) {
        user.profileImage = `/uploads/${req.file.filename}`;
      }

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Profile update failed" });
    }
  }
);

/* =====================================================
   UPDATE USER PASSWORD
===================================================== */
router.put("/password", protect, async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findById(req.user._id);
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully" });
});

module.exports = router;
