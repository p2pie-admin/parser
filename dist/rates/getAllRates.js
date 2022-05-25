"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_1 = __importDefault(require("./ParserHandlers/Parser"));
const db_1 = __importDefault(require("../db"));
const MainLoopLogic_1 = __importDefault(require("./MainLoopLogic"));
const getAllRates = () => {
    console.log("-= Rates Requested =-");
    const exchangers = db_1.default.getData('.exchangers');
    const { timeout = 30000, gap = 250 } = db_1.default.getData(".parser_setting");
    const restartMainLoopIn = gap * Object.keys(exchangers).length + timeout + 2000;
    setInterval(() => {
        (0, MainLoopLogic_1.default)();
        console.log("MAIN LOOP RESTARTED");
    }, restartMainLoopIn);
    const parser = new Parser_1.default(exchangers);
    parser.pollExchangerLinks(gap);
    console.log("will restart main loop in: ", restartMainLoopIn);
};
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map