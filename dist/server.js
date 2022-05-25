"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const handleWebhookPayload_1 = __importDefault(require("./handleWebhookPayload"));
const fastify_websocket_1 = __importDefault(require("fastify-websocket"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const getAllRates_1 = __importDefault(require("./rates/getAllRates"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const dbRates_1 = __importDefault(require("./dbRates"));
const server = (0, fastify_1.default)();
exports.server = server;
server.register(fastify_websocket_1.default);
server.register(fastify_static_1.default, {
    root: path_1.default.join(__dirname, "../public"),
    prefix: "/public/",
});
server.get("/", async function (_, reply) {
    reply.sendFile("menu.html");
});
server.get("/parser_setting", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".parser_setting")));
});
server.get("/exchangers", async function (_, reply) {
    const exchangers = db_1.default.getData(".exchangers");
    reply.send(JSON.stringify(exchangers.length ? exchangers : "no active exchangers!"));
});
server.get("/warnings", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".warnings")));
});
server.get("/errors", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".errors")));
});
server.post("/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf", async function (request, reply) {
    var _a;
    if ((_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.model)
        await (0, handleWebhookPayload_1.default)(request === null || request === void 0 ? void 0 : request.body);
    reply.send((request === null || request === void 0 ? void 0 : request.body) || "error");
});
server.get("/dir=:dirId/tops=:tops", async function (request, reply) {
    const { dirId, tops } = request.params;
    if (dirId && dirId.length < 20 && dirId.includes("_")) {
        reply.send(JSON.stringify(dbRates_1.default.getData(tops === "true" ? ".dirTops" : ".dirRates")));
    }
    else {
        reply.send("wrong request");
        reply.code(500);
    }
});
const start = async () => {
    try {
        await server.listen(process.env.PORT || 5000, "0.0.0.0");
        await (0, initialLoader_1.default)();
        (0, getAllRates_1.default)();
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map