const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

// ✅ multer setup
const multer = require("multer");
const path = require("path");

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= AUTH ROUTES =================

// REGISTER (admin / user / worker)
router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "idProof", maxCount: 1 }
  ]),
  register
);

// LOGIN
router.post("/login", login);



module.exports = router;
