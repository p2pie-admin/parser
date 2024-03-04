"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
exports.default = () => {
    for (const [key, value] of Object.entries(process_1.default.memoryUsage())) {
        console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
    }
};
