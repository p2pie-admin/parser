"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const preferencesLoader_1 = __importDefault(require("./preferencesLoader"));
const handleDirRequest_1 = __importDefault(require("./dirs/handleDirRequest"));
const fastify_websocket_1 = __importDefault(require("fastify-websocket"));
const db_1 = __importDefault(require("./db"));
const server = (0, fastify_1.default)();
exports.server = server;
server.register(fastify_websocket_1.default);
const allRoutes = {
    routes: ["/rates", "/dirs", "/preferences", "/problematic"],
};
server.get("/", async function (_, reply) {
    reply.send(JSON.stringify(allRoutes));
});
server.get("/preferences", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".preferences")));
});
server.get("/problematic", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".problematicRates")));
});
server.get("/rate=:dirId", async function (request, reply) {
    const { dirId } = request.params;
    if (dirId && dirId.length < 20 && dirId.includes("_")) {
        const res = await (0, handleDirRequest_1.default)(dirId.toUpperCase());
        reply.send(JSON.stringify(res));
    }
    else {
        reply.send("wrong request");
    }
});
server.get("/websocket", { websocket: true }, (connection) => {
    connection.socket.on("message", async (message) => {
        const dirId = String(message);
        if (dirId && dirId.length < 20 && dirId.includes("_")) {
            const res = await (0, handleDirRequest_1.default)(dirId.toUpperCase());
            connection.socket.send(JSON.stringify(res));
        }
        else {
            connection.socket.send("wrong request");
        }
    });
});
const start = async () => {
    try {
        await server.listen(process.env.PORT || 5000, "0.0.0.0");
        await (0, preferencesLoader_1.default)();
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map