function securityHeaders(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(self)");
    res.setHeader(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "form-action 'self'"
        ].join("; ")
    );

    next();
}

function optionalCors(allowedOrigin) {
    return function corsMiddleware(req, res, next) {
        if (!allowedOrigin) {
            return next();
        }

        if (req.headers.origin === allowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
            res.setHeader("Vary", "Origin");
            res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, X-Cart-Id"
            );
            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PATCH, DELETE, OPTIONS"
            );
        }

        if (req.method === "OPTIONS") {
            return res.sendStatus(204);
        }

        next();
    };
}

module.exports = {
    securityHeaders,
    optionalCors
};
