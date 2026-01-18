const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// Q1..Q6
router.get("/q1", statsController.q1);
router.get("/q2", statsController.q2);
router.get("/q3", statsController.q3);
router.get("/q4", statsController.q4);
router.get("/q5", statsController.q5);
router.get("/q6", statsController.q6);

module.exports = router;