"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "fallback_secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
function signToken(payload) {
    const options = {
        expiresIn: EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, SECRET, options);
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
//# sourceMappingURL=jwt.js.map