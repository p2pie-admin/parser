"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const handleWebhookPayload_1 = __importDefault(require("./handleWebhookPayload"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const startMainFlow_1 = __importDefault(require("./startMainFlow"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const dbRates_1 = __importDefault(require("./dbRates"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./gql/auth"));
dotenv_1.default.config();
const server = (0, fastify_1.default)();
exports.server = server;
server.register(fastify_static_1.default, {
    root: path_1.default.join(__dirname, "../public"),
    prefix: "/public/",
});
server.get("/", async function (_, reply) {
    reply.sendFile("menu.html");
});
server.get("/exchangers", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const exchangers = db_1.default.getData(".exchangers");
    reply.send(JSON.stringify(Object.keys(exchangers).length ? exchangers : "no active exchangers!"));
});
server.get("/errors", async function (_, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.send(JSON.stringify(db_1.default.getData(".errors")));
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
server.post("/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf", async function (request, reply) {
    var _a;
    if ((_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.model)
        await (0, handleWebhookPayload_1.default)(request === null || request === void 0 ? void 0 : request.body);
    reply.send((request === null || request === void 0 ? void 0 : request.body) || "error");
});
server.get("/possible_pairs/code=:code", async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { code } = request.params;
    if (code && code.length < 8) {
        reply.send(JSON.stringify(db_1.default.getData(`.possible_pairs.${code.toUpperCase()}`)));
    }
    reply.send(JSON.stringify(db_1.default.getData(".parser_setting")));
});
server.get("/dir=:dirId/tops=:tops", async function (request, reply) {
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
const start = async () => {
    try {
        await server.listen({ port: +(process.env.PORT || 5000), host: "0.0.0.0" });
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
    await (0, auth_1.default)();
    await (0, initialLoader_1.default)();
    (0, startMainFlow_1.default)();
};
start();
//# sourceMappingURL=server.js.map