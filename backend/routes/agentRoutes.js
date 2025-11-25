const express = require("express");
const auth = require("../middleware/auth");
const { runAgent } = require("../controllers/agentController");

const router = express.Router();

router.post("/run", auth, runAgent);

module.exports = router;
