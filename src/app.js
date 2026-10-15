const express = require("express");
const path = require("path");

const config = require("./config");
const apiRouter = require("./routes");
const {
    securityHeaders,
    optionalCors
} = require("./middleware/security");
const { requestContext } = require("./middleware/requestContext");

function createApp() {
    const app = express();

    app.disable("x-powered-by");

    if (config.trustProxy) {
        app.set("trust proxy", 1);
    }

    app.use(requestContext);
    app.use(securityHeaders);
    app.use(optionalCors(config.corsOrigin));
    app.use(
        express.json({
            limit: "64kb",
            strict: true
        })
    );

    app.use("/api", apiRouter);

    app.use(
        express.static(
            path.join(__dirname, "..", "public"),
            {
                etag: true,
                maxAge: "5m"
            }
        )
    );

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found.",
            requestId: req.requestId
        });
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }

        if (
            error instanceof SyntaxError &&
            error.status === 400 &&
            "body" in error
        ) {
            return res.status(400).json({
                success: false,
                message: "Malformed JSON request body.",
                requestId: req.requestId
            });
        }

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal server error.",
            requestId: req.requestId
        });
    });

    return app;
}

module.exports = {
    createApp
};
