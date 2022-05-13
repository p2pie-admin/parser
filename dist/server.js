"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const fastify_websocket_1 = __importDefault(require("fastify-websocket"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const getAllRates_1 = __importDefault(require("./rates/getAllRates"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
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
server.get("/parser_settings", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".parser_setting")));
});
server.get("/exchangers", async function (_, reply) {
    const exchangers = db_1.default.getData(".exchangers");
    reply.send(JSON.stringify(exchangers.length ? exchangers : "no active exchangers!"));
});
server.get("/dirs", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".dirs")));
});
server.get("/warnings", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".warnings")));
});
server.get("/errors", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".errors")));
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