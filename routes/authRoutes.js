const express = require("express");
const { register, login, logout, getUserDetails } = require("../controller/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);
router.get("/user-details", isAuthenticated, getUserDetails);

module.exports = router;
