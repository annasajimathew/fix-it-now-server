// controllers/workerController.js
const User = require("../models/userModel");

// @desc    Get logged-in worker profile
// @route   GET /api/worker/profile
// @access  Worker
exports.getWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user._id).select("-password");

    if (!worker || worker.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update worker profile
// @route   PUT /api/worker/profile
// @access  Worker
exports.updateWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user._id);

    if (!worker || worker.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    worker.name = req.body.name || worker.name;
    worker.service = req.body.service || worker.service;

    await worker.save();

    res.json({
      message: "Profile updated successfully",
      worker,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
