const express = require("express");
const gallery = require("../../data/gallery.json");

const router = express.Router();

router.get("/", (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");

    res.status(200).json({
        success: true,
        count: gallery.length,
        data: gallery
    });
});

module.exports = router;
