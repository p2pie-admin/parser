import fastify, { FastifyRequest } from "fastify";
//import handleDirRequest from "./dirs/handleDirRequest";
import handleWebhookPayload from "./handleWebhookPayload";
//import websocket from "fastify-websocket";
import fastifyStatic from "fastify-static";

import path from "path";
import db from "./db";
import dbRates from "./dbRates";
import { DirData } from "./types";
import { AllDirsRates, AllDirsTops } from "./types/rates";
import dotenv from "dotenv";

import { getPopularRates } from "./rates/Statistics/getPopularRates";

import startParser from "./startParser";
import rememberDirVisits from "./tests/rememberDirVisits";
import { handleDirRequest } from "./helper";

dotenv.config();

const server = fastify();

//server.register(websocket);

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/public/",
});

server.get("/", async function (_, reply) {
  reply.sendFile("menu.html");
});

server.get("/exchangers", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const exchangers = db.getData(".exchangers");
  reply.send(
    JSON.stringify(
      Object.keys(exchangers).length ? exchangers : "no active exchangers!"
    )
  );
});

server.get("/errors", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.send(JSON.stringify(db.getData(".errors")));
});

server.get("/popular_rates", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const bestRates = getPopularRates();
  reply.send(JSON.stringify(bestRates));
});

interface DirDataWithTotalRates extends DirData {
  totalRates: number;
}

server.get("/dirs", (_, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  const allDirRates = dbRates.getData(".allDirsRates") as AllDirsRates;
  const totalRatesByDir = Object.entries(allDirRates).reduce(
    (res: { [key: string]: number }, [code, dirRate]) => {
      res = { ...res, [code]: Object.keys(dirRate).length };
      return res;
    },
    {}
  );

  const dirs = db.getData(`.dirs`) as { [key: string]: DirData };
  const dirsWithTotalRates = Object.entries(dirs).reduce(
    (res: { [key: string]: DirDataWithTotalRates }, [code, dirData]) => {
      return {
        ...res,
        [code]: { ...dirData, totalRates: totalRatesByDir[code] },
      };
    },
    {}
  );
  reply.send(JSON.stringify(dirsWithTotalRates));
});

server.post(
  "/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf",
  async function (request: any, reply) {
    // эта херня слушает вебхуку и срабатывает при апдейте exchangers или parser_setting
    if (request?.body?.model) await handleWebhookPayload(request?.body);
    reply.send(request?.body || "error");
  }
);

type dirReq = FastifyRequest<{ Params: { dirId: string; type: string } }>;
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

server.get("/dir=:dirId/type=:type", async function (request: dirReq, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const { dirId, type } = request.params;
  const sendFunction = (data: any) => reply.send(JSON.stringify(data));

  handleDirRequest(sendFunction, dirId, type);
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

const startServer = async () => {
  try {
    // HOST IS IMPORTANT, OTHERWISE DOCKER PORT EXPOSE NOT WORKING
    await server.listen({ port: +(process.env.PORT || 5000), host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }

  startParser();
};

startServer();

export { server };
