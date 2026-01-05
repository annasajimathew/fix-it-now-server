const Review = require("../models/reviewModel");
const User = require("../models/userModel");

// @desc    Add review (User → Worker)
// @route   POST /api/reviews
// @access  User
exports.addReview = async (req, res) => {
  try {
    const { workerId, rating, comment } = req.body;

    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can add reviews" });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    const review = await Review.create({
      user: req.user._id,
      worker: workerId,
      rating,
      comment,
    });

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get reviews of logged-in worker
// @route   GET /api/reviews/worker
// @access  Worker
exports.getWorkerReviews = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reviews = await Review.find({ worker: req.user._id })
      .populate("user", "name");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Admin → get all reviews
// @route   GET /api/reviews
// @access  Admin
exports.getAllReviews = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reviews = await Review.find()
      .populate("user", "name")
      .populate("worker", "name service");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
