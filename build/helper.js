"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDirRequest = void 0;
const dbRates_1 = __importDefault(require("./dbRates"));
const handleDirRequest = (send, dirId, type) => {
    const dirTopsExist = dbRates_1.default.exists(`.allDirsTops.${dirId}`);
    const dirRatesExist = dbRates_1.default.exists(`.allDirsRates.${dirId}`);
    const dirP2PExist = dbRates_1.default.exists(`.allDirsP2P.${dirId}`);
    switch (type) {
        case "p2p":
            dirP2PExist ? send(dbRates_1.default.getData(`.allDirsP2P.${dirId}`)) : send([]);
            break;
        case "tops":
            dirTopsExist ? send(dbRates_1.default.getData(`.allDirsTops.${dirId}`)) : send([]);
            break;
        case "tops+p2p":
            if (!dirP2PExist && !dirTopsExist)
                send([]);
            const dirP2P = dirP2PExist ? dbRates_1.default.getData(`.allDirsP2P.${dirId}`) : [];
            const dirTops = dirTopsExist
                ? dbRates_1.default.getData(`.allDirsTops.${dirId}`)
                : [];
            send([...dirTops, ...dirP2P]);
            break;
        default:
            dirRatesExist
                ? send(dbRates_1.default.getData(`.allDirsRates.${dirId}`))
                : send([]);
    }
};
exports.handleDirRequest = handleDirRequest;
