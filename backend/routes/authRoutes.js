const express = require("express");
const { body, validationResult } = require("express-validator");
const { signup, login, me, changePassword, deleteAccount, checkUsername, updateUsername } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const validateSignup = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-z0-9_]+$/i).withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(400)
      .json({ errors: errors.array().map((e) => e.msg) });
  next();
};

router.post("/signup", validateSignup, handleValidation, signup);
router.post("/login", validateLogin, handleValidation, login);
router.post("/check-username", checkUsername);

router.get("/me", protect, me);
router.post("/update-username", protect, updateUsername);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;

