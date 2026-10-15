const express = require("express");
const pkg = require("../../package.json");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        service: "Pizza Pie Parlor Backend",
        version: pkg.version,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
