function ok(res, data, extras = {}) {
    return res.status(200).json({
        success: true,
        ...extras,
        data
    });
}

function badRequest(res, message, extras = {}) {
    return res.status(400).json({
        success: false,
        message,
        ...extras
    });
}

function notFound(res, message = "Resource not found.") {
    return res.status(404).json({
        success: false,
        message
    });
}

module.exports = {
    ok,
    badRequest,
    notFound
};
