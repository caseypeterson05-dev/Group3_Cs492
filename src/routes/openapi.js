const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const specPath = path.join(__dirname, "..", "..", "docs", "openapi.yaml");
const spec = fs.readFileSync(specPath, "utf8");

router.get("/", (req, res) => {
    res.setHeader("Content-Type", "application/yaml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(spec);
});

module.exports = router;
