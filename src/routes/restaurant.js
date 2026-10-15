const express = require("express");
const restaurant = require("../../data/restaurant.json");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        data: restaurant
    });
});

module.exports = router;
