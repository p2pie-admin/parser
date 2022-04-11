"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class Parser {
    constructor() {
        this._getXML = (link) => {
            axios_1.default
                .get(link)
                .then(function (response) {
                console.log(response.data);
            })
                .catch(function (error) {
                console.log(error);
            })
                .then(function () { });
        };
    }
}
exports.default = Parser;
//# sourceMappingURL=parser.js.map