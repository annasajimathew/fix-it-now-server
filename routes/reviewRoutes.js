const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const protect = require("../middleware/authMiddleware");

/* ========= PUBLIC – GET REVIEWS OF A WORKER ========= */
router.get("/public/:workerId", async (req, res) => {
  try {
    const reviews = await Review.find({
      worker: req.params.workerId,
    }).populate("user", "name profileImage");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/* ========= WORKER – GET OWN REVIEWS ========= */
router.get("/worker", protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reviews = await Review.find({
      worker: req.user._id,
    }).populate("user", "name profileImage");

    res.json(reviews);
  } catch (err) {
    console.error("WORKER REVIEWS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/* ========= ADMIN – GET ALL REVIEWS ========= */
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reviews = await Review.find()
      .populate("user", "name profileImage")
      .populate("worker", "name service");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all reviews" });
  }
});

/* ========= USER – ADD REVIEW ========= */
router.post("/:workerId", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can add reviews" });
    }

    const { rating, comment } = req.body;

    const review = await Review.create({
      worker: req.params.workerId,
      user: req.user._id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Failed to add review" });
  }
});

/* ========= DELETE REVIEW ========= */
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (
      req.user.role !== "admin" &&
      review.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;
