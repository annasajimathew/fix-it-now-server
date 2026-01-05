const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String
    },

    role: {
      type: String,
      enum: ["admin", "worker", "user"],
      required: true
    },

    service: {
      type: String,
      default: ""
    },

    experience: {
      type: Number,
      default: 0
    },

    languages: {
      type: [String],
      default: []
    },

    education: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: ""
    },

    profileImage: {
      type: String,
      default: ""
    },

    idProof: {
      type: String,
      default: ""
    },

    isApproved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
