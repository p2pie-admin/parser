"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
exports.default = (dirId) => {
    try {
        const dirDataExists = db_1.default.exists(`.dirs.${dirId}`);
        if (!dirDataExists)
            return;
        const dirData = db_1.default.getData(`.dirs.${dirId}`);
        const visits = dirData.times_visited ? dirData.times_visited : 0;
        db_1.default.push(`.dirs.${dirId}.times_visited`, visits + 1);
    }
    catch (e) {
        console.log(e);
    }
};
