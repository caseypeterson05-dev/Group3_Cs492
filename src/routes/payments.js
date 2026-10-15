const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/status", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            provider: config.paymentProvider || null,
            configured: Boolean(config.paymentProvider),
            pciGatewayRequired: true,
            storesCardDataLocally: false,
            status:
                config.paymentProvider
                    ? "Gateway provider selected; provider SDK integration still required."
                    : "No payment gateway configured."
        }
    });
});

router.post("/create-session", (req, res) => {
    const forbiddenFields = [
        "cardNumber",
        "cvv",
        "cvc",
        "securityCode",
        "expiration",
        "expiry"
    ];

    const submittedForbiddenField =
        forbiddenFields.find(field =>
            Object.prototype.hasOwnProperty.call(
                req.body || {},
                field
            )
        );

    if (submittedForbiddenField) {
        return res.status(400).json({
            success: false,
            message:
                "Raw card data must not be sent to or stored by this backend. Use the PCI-compliant payment provider's client SDK/tokenization flow."
        });
    }

    res.status(501).json({
        success: false,
        message:
            "Payment gateway scaffold only. Integrate the selected PCI-compliant provider before completing secure checkout."
    });
});

module.exports = router;
