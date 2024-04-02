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
const db_1 = __importDefault(require("./db"));
const dbRates_1 = __importDefault(require("./dbRates"));
const dotenv_1 = __importDefault(require("dotenv"));
const getPopularRates_1 = require("./rates/Statistics/getPopularRates");
const startParser_1 = __importDefault(require("./startParser"));
const helper_1 = require("./helper");
dotenv_1.default.config();
const server = (0, fastify_1.default)();
exports.server = server;
//server.register(websocket);
// server.register(fastifyStatic, {
//   root: path.join(__dirname, "../public"),
//   prefix: "/public/",
// });
// server.get("/", async function (_, reply) {
//   reply.sendFile("menu.html");
// });
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
server.get("/popular_rates", function (_, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        const bestRates = (0, getPopularRates_1.getPopularRates)();
        reply.send(JSON.stringify(bestRates));
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
server.get("/dir=:dirId/type=:type", function (request, reply) {
    return __awaiter(this, void 0, void 0, function* () {
        reply.header("Access-Control-Allow-Origin", "*");
        const { dirId, type } = request.params;
        const sendFunction = (data) => reply.send(JSON.stringify(data));
        (0, helper_1.handleDirRequest)(sendFunction, dirId, type);
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
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // HOST IS IMPORTANT, OTHERWISE DOCKER PORT EXPOSE NOT WORKING
        yield server.listen({
            port: +(process.env.PARSER_PORT || 5000),
            host: "0.0.0.0",
        });
        (0, startParser_1.default)();
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
});
startServer();
console.log(" -------------------------- STARTED -------------------------- ");
