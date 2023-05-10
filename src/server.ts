import fastify, { FastifyRequest } from "fastify";
//import handleDirRequest from "./dirs/handleDirRequest";
import handleWebhookPayload from "./handleWebhookPayload";
//import websocket from "fastify-websocket";
import fastifyStatic from "fastify-static";
import initialLoader from "./initialLoader";
import startMainFlow from "./startMainFlow";
import statusChange from "./statusChange";
import path from "path";
import db from "./db";
import dbRates from "./dbRates";
import { DirData } from "./types";
import { AllDirsRates, AllDirsTops } from "./types/rates";
import dotenv from "dotenv";
import auth from "./gql/auth";
import callStrapi from "./gql/callStrapi";

import getBuySellsRates from "./rates/Statistics/bestRatesHandler";

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

server.get("/best", async function (_, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  const bestRates = getBuySellsRates();
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
    try {
      const dirData = db.getData(`.dirs.${dirId}`) as DirData;
      if (!dirData) return;
      const visits = dirData.times_visited ? dirData.times_visited : 0;
      db.push(`.dirs.${dirId}.times_visited`, visits + 1);
    } catch (e) {
      console.log(e);
    }
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
    // HOST IS IMPORTANT, OTHERWISE DOCKER PORT EXPOSE NOT WORKING
    await server.listen({ port: +(process.env.PORT || 5000), host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }

  // createExchangers() call to initilize exchangers from links JSON
  await auth();
  await statusChange("suspended", "active");
  await statusChange("disabled", "active");
  await initialLoader();
  // startMainFlow();
};

start();

export { server };
