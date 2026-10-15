const express = require("express");
const config = require("../config");
const { haversineMiles } = require("../utils/distance");

const router = express.Router();

router.get("/config", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            radiusMiles: config.delivery.radiusMiles,
            coordinateInputRequired: true
        }
    });
});

router.post("/validate", (req, res) => {
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            deliverable: false,
            message:
                "Valid latitude and longitude are required. A frontend geocoder can convert a delivery address into coordinates before calling this endpoint."
        });
    }

    const distanceMiles = haversineMiles(
        config.delivery.restaurantLatitude,
        config.delivery.restaurantLongitude,
        latitude,
        longitude
    );

    const deliverable =
        distanceMiles <= config.delivery.radiusMiles;

    res.status(200).json({
        success: true,
        deliverable,
        message: deliverable
            ? "Address is within the delivery radius."
            : "Address is outside the delivery radius.",
        distanceMiles: Number(distanceMiles.toFixed(2)),
        radiusMiles: config.delivery.radiusMiles
    });
});

module.exports = router;
