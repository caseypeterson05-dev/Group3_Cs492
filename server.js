const fs = require("fs");
const http = require("http");
const https = require("https");

const config = require("./src/config");
const { createApp } = require("./src/app");

const app = createApp();

function start() {
    let server;
    let protocol = "http";

    if (config.https.enabled) {
        if (!config.https.keyFile || !config.https.certFile) {
            throw new Error(
                "HTTPS=true requires SSL_KEY_FILE and SSL_CERT_FILE."
            );
        }

        const options = {
            key: fs.readFileSync(config.https.keyFile),
            cert: fs.readFileSync(config.https.certFile)
        };

        server = https.createServer(options, app);
        protocol = "https";
    } else {
        server = http.createServer(app);
    }

    server.listen(config.port, config.host, () => {
        console.log("");
        console.log("Pizza Pie Parlor Backend");
        console.log("------------------------");
        console.log(
            `Server: ${protocol}://${config.host}:${config.port}`
        );
        console.log(
            `API index: ${protocol}://${config.host}:${config.port}/api`
        );
        console.log("");
    });

    const shutdown = signal => {
        console.log(`Received ${signal}. Shutting down cleanly...`);
        server.close(error => {
            if (error) {
                console.error(error);
                process.exitCode = 1;
            }
        });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));

    return server;
}

if (require.main === module) {
    start();
}

module.exports = {
    start
};
