const User = require("../models/userModel");

// Get all workers (admin only)
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: "worker" }).select("-password");
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workers" });
  }
};

// Approve worker
exports.approveWorker = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    worker.isApproved = true;
    await worker.save();

    res.json({ message: "Worker approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Approval failed" });
  }
};
