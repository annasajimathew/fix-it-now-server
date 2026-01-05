const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");

// GET all workers (pending + approved)
router.get("/workers", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const workers = await User.find({ role: "worker" }).select("-password");
  res.json(workers);
});

// GET all users (admin)
router.get("/users", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const users = await User.find({ role: "user" }).select("-password");
  res.json(users);
});

// APPROVE worker
router.put("/approve-worker/:id", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const worker = await User.findById(req.params.id);

  if (!worker || worker.role !== "worker") {
    return res.status(404).json({ message: "Worker not found" });
  }

  worker.isApproved = true;
  await worker.save();

  res.json({ message: "Worker approved successfully" });
});

// ❌ DELETE worker (pending OR approved)
router.delete("/worker/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    // delete profile image
    if (worker.profileImage) {
      const profilePath = path.join(__dirname, "..", worker.profileImage);
      if (fs.existsSync(profilePath)) fs.unlinkSync(profilePath);
    }

    // delete id proof
    if (worker.idProof) {
      const idPath = path.join(__dirname, "..", worker.idProof);
      if (fs.existsSync(idPath)) fs.unlinkSync(idPath);
    }

    await worker.deleteOne();

    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete worker" });
  }
});

module.exports = router;
