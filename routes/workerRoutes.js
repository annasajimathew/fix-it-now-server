const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Review = require("../models/reviewModel"); // ⭐ ADDED
const protect = require("../middleware/authMiddleware"); // ✅ FIX

// ================= PUBLIC =================

// 🔓 PUBLIC: Get approved workers by profession + optional location
router.get("/:profession", async (req, res) => {
  try {
    const { profession } = req.params;
    const { location } = req.query;

    const query = {
      role: "worker",
      isApproved: true,
      service: { $regex: new RegExp(`^${profession}$`, "i") }
    };

    // location filter (case-insensitive)
    if (location) {
      query.location = { $regex: new RegExp(location, "i") };
    }

    const workers = await User.find(query).select("-password");

    // ⭐ ADDED: attach average rating + review count
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

    res.json(workersWithRating); // ⭐ CHANGED OUTPUT ONLY
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

// Get worker profile by ID
router.get("/profile/:id", async (req, res) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker",
      isApproved: true
    }).select("-password");

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // ⭐ ADDED: average rating for profile page
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
    res.status(500).json({ message: "Failed to fetch worker profile" });
  }
});

// ================= PROTECTED =================

// Update worker profile
router.put("/profile", protect, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedWorker = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedWorker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
