"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const Loop_1 = __importDefault(require("../Loop"));
exports.default = () => {
    const allExchangers = db_1.default.getData(".exchangers");
    Object.entries(allExchangers).map(([exchangerId, exchangerData]) => {
        if (!exchangerData.isLooped) {
            const loop = new Loop_1.default(exchangerId);
            loop.run();
        }
    });
};
//# sourceMappingURL=checkIfAllExchangersLooped.js.map