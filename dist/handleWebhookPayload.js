"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const initialLoader_1 = __importDefault(require("./initialLoader"));
async function handleWebhookPayload(payload) {
    if (payload.model === "rates-filter-preferences" ||
        payload.model === "exchanger") {
        await (0, initialLoader_1.default)();
    }
}
exports.default = handleWebhookPayload;
//# sourceMappingURL=handleWebhookPayload.js.map