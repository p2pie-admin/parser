"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
//import handleDirRequest from "./dirs/handleDirRequest";
const handleWebhookPayload_1 = __importDefault(require("./handleWebhookPayload"));
const fastify_websocket_1 = __importDefault(require("fastify-websocket"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const startMainFlow_1 = __importDefault(require("./startMainFlow"));
const statusChange_1 = __importDefault(require("./statusChange"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const dbRates_1 = __importDefault(require("./dbRates"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./gql/auth"));
dotenv_1.default.config();
const server = (0, fastify_1.default)();
exports.server = server;
server.register(fastify_websocket_1.default);
server.register(fastify_static_1.default, {
    root: path_1.default.join(__dirname, "../public"),
    prefix: "/public/",
});
server.get("/", function (_, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.sendFile("menu.html");
    });
});
server.get("/exchangers", function (_, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        const exchangers = db_1.default.getData(".exchangers");
        reply.send(JSON.stringify(Object.keys(exchangers).length ? exchangers : "no active exchangers!"));
    });
});
server.get("/errors", function (_, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.send(JSON.stringify(db_1.default.getData(".errors")));
    });
});
server.get("/dirs", (_, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const allDirRates = dbRates_1.default.getData(".allDirsRates");
    const totalRatesByDir = Object.entries(allDirRates).reduce((res, [code, dirRate]) => {
        res = Object.assign(Object.assign({}, res), { [code]: Object.keys(dirRate).length });
        return res;
    }, {});
    const dirs = db_1.default.getData(`.dirs`);
    const dirsWithTotalRates = Object.entries(dirs).reduce((res, [code, dirData]) => {
        return Object.assign(Object.assign({}, res), { [code]: Object.assign(Object.assign({}, dirData), { totalRates: totalRatesByDir[code] }) });
    }, {});
    reply.send(JSON.stringify(dirsWithTotalRates));
});
server.post("/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf", function (request, reply) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // эта херня слушает вебхуку и срабатывает при апдейте exchangers или parser_setting
        if ((_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.model)
            yield (0, handleWebhookPayload_1.default)(request === null || request === void 0 ? void 0 : request.body);
        reply.send((request === null || request === void 0 ? void 0 : request.body) || "error");
    });
});
server.get("/possible_pairs/code=:code", function (request, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        const { code } = request.params;
        if (code && code.length < 8) {
            reply.send(JSON.stringify(db_1.default.getData(`.possible_pairs.${code.toUpperCase()}`)));
        }
        reply.send(JSON.stringify(db_1.default.getData(".parser_setting")));
    });
});
server.get("/dir=:dirId/tops=:tops", function (request, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        const { dirId, tops } = request.params;
        if (dirId && dirId.length < 20 && dirId.includes("_")) {
            reply.send(JSON.stringify(dbRates_1.default.getData(tops === "true" ? `.allDirsTops.${dirId}` : `.allDirsRates.${dirId}`)));
            try {
                const dirData = db_1.default.getData(`.dirs.${dirId}`);
                if (!dirData)
                    return;
                const visits = dirData.times_visited ? dirData.times_visited : 0;
                db_1.default.push(`.dirs.${dirId}.times_visited`, visits + 1);
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            reply.send("wrong request");
            reply.code(500);
        }
    });
});
// server.get("/websocket", { websocket: true }, (connection) => {
//   connection.socket.on("message", async (message) => {
//     const dirId = String(message);
//     if (dirId && dirId.length < 20 && dirId.includes("_")) {
//       const res = await handleDirRequest(dirId.toUpperCase());
//       connection.socket.send(JSON.stringify(res));
//     } else {
//       connection.socket.send("wrong request");
//     }
//   });
// });
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield server.listen(process.env.PORT || 5000, "0.0.0.0");
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
    // createExchangers() call to initilize exchangers from links JSON
    yield (0, statusChange_1.default)("suspended", "active");
    yield (0, statusChange_1.default)("disabled", "active");
    yield (0, auth_1.default)();
    yield (0, initialLoader_1.default)();
    (0, startMainFlow_1.default)();
});
start();
