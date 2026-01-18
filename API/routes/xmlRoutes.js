const express = require("express");
const router = express.Router();

const xmlMiddleware = require("../middlewares/xmlMiddleware");
const xmlController = require("../controllers/xmlController");

router.post("/xml", xmlMiddleware, xmlController.ingest);

module.exports = router;
