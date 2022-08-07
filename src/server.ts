import fastify, { FastifyRequest } from "fastify";

//import handleDirRequest from "./dirs/handleDirRequest";
import handleWebhookPayload from "./handleWebhookPayload";
import websocket from "fastify-websocket";
import fastifyStatic from "fastify-static";
import initialLoader from "./initialLoader";
import startMainFlow from "./startMainFlow";
import statusChange from "./dbRates/statusChange";
import path from "path";
import db from "./db";
import dbRates from "./dbRates";

// import createExchangers from "./dbRates/createExchangers";
//import bulkStatusChange from "./dbRates/bulkStatusChange";

const server = fastify();

server.register(websocket);

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/public/",
});

server.get("/", async function (_, reply) {
  reply.sendFile("menu.html");
});

server.get("/parser_setting", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".parser_setting")));
});

server.get("/exchangers", async function (_, reply) {
  const exchangers = db.getData(".exchangers");
  reply.send(
    JSON.stringify(
      Object.keys(exchangers).length ? exchangers : "no active exchangers!"
    )
  );
});

server.get("/warnings", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".warnings")));
});

server.get("/errors", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".errors")));
});

server.post(
  "/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf",
  async function (request: any, reply) {
    // эта херня слушает вебхуку и срабатывает при апдейте exchangers или parser_setting
    if (request?.body?.model) await handleWebhookPayload(request?.body);
    reply.send(request?.body || "error");
  }
);

type dirReq = FastifyRequest<{ Params: { dirId: string; tops: string } }>;
type possiblePairsReq = FastifyRequest<{ Params: { code: string } }>;

server.get(
  "/possible_pairs/code=:code",
  async function (request: possiblePairsReq, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    const { code } = request.params;
    if (code && code.length < 8) {
      reply.send(
        JSON.stringify(db.getData(`.possible_pairs.${code.toUpperCase()}`))
      );
    }
    reply.send(JSON.stringify(db.getData(".parser_setting")));
  }
);

server.get("/dir=:dirId/tops=:tops", async function (request: dirReq, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dirId, tops } = request.params;
  if (dirId && dirId.length < 20 && dirId.includes("_")) {
    reply.send(
      JSON.stringify(
        dbRates.getData(
          tops === "true" ? `.allDirsTops.${dirId}` : `.allDirsRates.${dirId}`
        )
      )
    );
  } else {
    reply.send("wrong request");
    reply.code(500);
  }
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

const start = async () => {
  try {
    //createExchangers() call to initilize exchangers from links JSON
    await server.listen(process.env.PORT || 5000, "0.0.0.0");
    await statusChange("suspended", "active");
    await statusChange("disabled", "active");
    await initialLoader();
    startMainFlow();
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();

export { server };
