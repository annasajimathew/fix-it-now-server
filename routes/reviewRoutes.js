const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const protect = require("../middleware/authMiddleware");

/* ================= ADD REVIEW ================= */
router.post("/:workerId", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can add reviews" });
    }

    const { rating, comment } = req.body;

    const review = await Review.create({
      worker: req.params.workerId,
      user: req.user.id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Failed to add review" });
  }
});

/* ================= GET WORKER REVIEWS ================= */
router.get("/:workerId", async (req, res) => {
  try {
    const reviews = await Review.find({
      worker: req.params.workerId,
    }).populate("user", "name");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/* ================= DELETE REVIEW ================= */
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // user can delete own review OR admin can delete any
    if (
      review.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;
