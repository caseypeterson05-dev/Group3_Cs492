const { randomUUID } = require("crypto");

function requestContext(req, res, next) {
    const incoming = req.get("X-Request-Id");
    const requestId =
        typeof incoming === "string" &&
        /^[A-Za-z0-9._:-]{1,100}$/.test(incoming)
            ? incoming
            : randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    next();
}

module.exports = {
    requestContext
};
