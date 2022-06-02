"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
exports.default = () => {
    const allExchangers = db_1.default.getData(".exchangers");
};
//# sourceMappingURL=checkIfAllExchangersLooped.js.map