const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Review = require("../models/reviewModel");
const protect = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// ✅ GET WORKER PROFILE BY ID (MUST COME FIRST)
router.get("/profile/:id", async (req, res) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker",
      isApproved: true,
    }).select("-password");

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Get reviews for rating
    const reviews = await Review.find({ worker: worker._id });

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) /
            reviews.length
          ).toFixed(1)
        : 0;

    res.json({
      ...worker.toObject(),
      averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch worker profile" });
  }
});

// ✅ GET APPROVED WORKERS BY PROFESSION + LOCATION
router.get("/:profession", async (req, res) => {
  try {
    const { profession } = req.params;
    const { location } = req.query;

    const query = {
      role: "worker",
      isApproved: true,
      service: { $regex: new RegExp(`^${profession}$`, "i") },
    };

    if (location) {
      query.location = { $regex: new RegExp(location, "i") };
    }

    const workers = await User.find(query).select("-password");

    const workersWithRating = await Promise.all(
      workers.map(async (worker) => {
        const reviews = await Review.find({ worker: worker._id });

        const averageRating =
          reviews.length > 0
            ? (
                reviews.reduce((sum, r) => sum + r.rating, 0) /
                reviews.length
              ).toFixed(1)
            : 0;

        return {
          ...worker.toObject(),
          averageRating,
          reviewCount: reviews.length,
        };
      })
    );

    res.json(workersWithRating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

/* =========================================================
   PROTECTED ROUTES
========================================================= */

// ✅ UPDATE WORKER PROFILE (SAFE FIELDS ONLY)
router.put("/profile", protect, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { experience, education, languages } = req.body;

    const updateData = {};

    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (languages !== undefined) {
      updateData.languages = Array.isArray(languages)
        ? languages
        : languages.split(",").map((l) => l.trim());
    }

    const updatedWorker = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedWorker,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});


/* =========================================================
   UPDATE WORKER PASSWORD
========================================================= */
router.put("/password", protect, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

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

    const worker = await User.findById(req.user._id);
    worker.password = await bcrypt.hash(newPassword, 10);
    await worker.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Password update failed" });
  }
});

module.exports = router;
