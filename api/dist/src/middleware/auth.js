"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jwt_1 = require("../lib/jwt");
/**
 * Middleware untuk memverifikasi JWT token dari header Authorization.
 * Format: `Authorization: Bearer <token>`
 *
 * Jika valid, `req.user` akan terisi dengan payload { id, role }.
 */
const verifyJWT = (req, res, next) => {
    const header = req.headers.authorization;
    let token = "";
    if (header && header.startsWith("Bearer ")) {
        token = header.split(" ")[1];
    }
    else if (req.query.token) {
        token = String(req.query.token);
    }
    if (!token) {
        console.log(`[Auth] Token missing for ${req.method} ${req.originalUrl}`);
        res.status(401).json({
            success: false,
            message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
        });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        // Bedakan antara token expired dan token invalid
        const isExpired = error instanceof Error && error.name === "TokenExpiredError";
        res.status(401).json({
            success: false,
            message: isExpired
                ? "Token sudah kadaluarsa. Silakan login kembali."
                : "Token tidak valid.",
        });
    }
};
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=auth.js.map