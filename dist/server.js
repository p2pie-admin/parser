"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const handleDirRequest_1 = __importDefault(require("./dirs/handleDirRequest"));
const handleWebhookPayload_1 = __importDefault(require("./handleWebhookPayload"));
const fastify_websocket_1 = __importDefault(require("fastify-websocket"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const getAllRates_1 = __importDefault(require("./rates/getAllRates"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const parser_1 = __importDefault(require("./xml/parser"));
const server = (0, fastify_1.default)();
exports.server = server;
server.register(fastify_websocket_1.default);
server.register(fastify_static_1.default, {
    root: path_1.default.join(__dirname, "../public"),
    prefix: "/public/",
});
console.log(path_1.default.join(__dirname));
server.get("/", async function (_, reply) {
    reply.sendFile("menu.html");
});
server.get("/preferences", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".preferences")));
});
server.get("/exchangers", async function (_, reply) {
    reply.send(JSON.stringify(db_1.default.getData(".exchangers")));
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
server.post("/webhooks-handler", async function (request, _) {
    (0, handleWebhookPayload_1.default)(request.body);
});
server.get("/dir=:dirId/full=:isFull", async function (request, reply) {
    const { dirId, isFull } = request.params;
    if (dirId && dirId.length < 20 && dirId.includes("_")) {
        const convertedDirRates = await (0, handleDirRequest_1.default)(dirId.toUpperCase());
        const res = isFull === "true"
            ? convertedDirRates === null || convertedDirRates === void 0 ? void 0 : convertedDirRates.rates
            : {
                bestRates: convertedDirRates === null || convertedDirRates === void 0 ? void 0 : convertedDirRates.bestRates,
                uniqueRates: convertedDirRates === null || convertedDirRates === void 0 ? void 0 : convertedDirRates.uniqueRates,
            };
        reply.send(JSON.stringify(res));
    }
    else {
        reply.send("wrong request");
    }
});
const start = async () => {
    try {
        console.log("started");
        const parser = new parser_1.default();
        parser._getXML("https://n-change.net/en/courses.xml?q=%2Fcourses.xml");
        await server.listen(process.env.PORT || 5000, "0.0.0.0");
        await (0, initialLoader_1.default)();
        setInterval(getAllRates_1.default, db_1.default.getData(".preferences.update_time_sec") * 1000);
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map