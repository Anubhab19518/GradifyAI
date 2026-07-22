const express = require("express");
const multer = require("multer");
const { register, login, updateProfilePicture, updateProfile } = require("../controller/signUpController");

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.post("/update-profile-picture", upload.single("profilePicture"), updateProfilePicture);
router.post("/update-profile", express.json(), updateProfile);

module.exports = router;
