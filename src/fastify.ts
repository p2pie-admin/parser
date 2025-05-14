// import fastify, { FastifyRequest } from "fastify";
// //import handleDirRequest from "./dirs/handleDirRequest";
// import handleWebhookPayload from "./handleWebhookPayload";
// //import websocket from "fastify-websocket";
// import fastifyStatic from "@fastify/static";
// import db from "./db";
// import dbRates from "./dbRates";
// import { DirData } from "./types";
// import { IDirtyRates, IAllDirsTops } from "./types/rates";
// import dotenv from "dotenv";
// import {
//   getPopularRates,
//   getSimilarRates,
// } from "./rates/Statistics/getPopularRates";
// import { handleDirRequest, menu, mylog } from "./helper";
// import auth from "./gql/auth";
// import startMainFlow from "./startMainFlow";
// import { getData, setData } from "./redis";
// import startWorkers from "./loops/fast";
// import reload from "./loops/reload";

// dotenv.config();

// const server = fastify({ logger: true });

// //server.register(websocket);

// server.register(fastifyStatic, {
//   root: __dirname,
//   // prefix: "/public/",
// });
// server.get("/", async function (_, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   return reply.send(menu);
// });

// server.get("/menu", async function (_, reply) {
//   return reply.sendFile("menu.html");
// });

// server.get("/top_codes", async function (_, reply) {
//   const topCodes = await getData("top_codes");
//   return reply.send(topCodes);
// });

// server.get("/ping", async function (_, reply) {
//   return reply.send("pong");
// });

// server.get("/exchangers", async function (_, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   const exchangers = await db.getData(".exchangers");
//   reply.send(
//     JSON.stringify(
//       Object.keys(exchangers).length ? exchangers : "no active exchangers!"
//     )
//   );
// });

// server.get("/errors", async function (_, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   reply.send(JSON.stringify(await getData("errors")));
// });

// server.get("/top", async function (_, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   const bestRates = getPopularRates();
//   reply.send(JSON.stringify(bestRates));
// });
// server.get("/similar/dirs=:dirsString", async function (request, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   const { dirsString } = request.params as { dirsString: string };
//   const dirs = dirsString.split(",");
//   if (!dirs || !dirs.length) {
//     reply.send("wrong dirs, try /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB");
//     return;
//   }
//   reply.send(JSON.stringify(getSimilarRates(dirs)));
// });

// server.get("/all_rates", async function (_, reply) {
//   const allRates = dbRates.getData(`.dirtyRates`);
//   reply.send(JSON.stringify(allRates));
// });

// interface DirDataWithTotalRates extends DirData {
//   totalRates: number;
// }

// server.get("/dirs", async (_, reply) => {
//   reply.header("Access-Control-Allow-Origin", "*");
//   const dirtyRates = (await dbRates.getData(".dirtyRates")) as IDirtyRates;
//   const totalRatesByDir = Object.entries(dirtyRates).reduce(
//     (res: { [key: string]: number }, [code, dirRate]) => {
//       res = { ...res, [code]: Object.keys(dirRate).length };
//       return res;
//     },
//     {}
//   );

//   const dirs = (await db.getData(`.dirs`)) as { [key: string]: DirData };
//   const dirsWithTotalRates = Object.entries(dirs).reduce(
//     (res: { [key: string]: DirDataWithTotalRates }, [code, dirData]) => {
//       return {
//         ...res,
//         [code]: { ...dirData, totalRates: totalRatesByDir[code] },
//       };
//     },
//     {}
//   );
//   reply.send(JSON.stringify(dirsWithTotalRates));
// });

// server.post(
//   "/cASTintOncHARtIVERyPHerAwBASintOncHITl82Kf",
//   async function (request: any, reply) {
//     // эта херня слушает вебхуку и срабатывает при апдейте exchangers или parser_setting
//     if (request?.body?.model) await handleWebhookPayload(request?.body);
//     reply.send(request?.body || "error");
//   }
// );

// type dirReq = FastifyRequest<{ Params: { dirId: string; type: string } }>;
// type possiblePairsReq = FastifyRequest<{ Params: { code: string } }>;

// server.get(
//   "/possible_pairs",
//   async function (request: possiblePairsReq, reply) {
//     reply.header("Access-Control-Allow-Origin", "*");
//     reply.send(JSON.stringify(await db.getData(`.possible_pairs`)));
//   }
// );

// server.get(
//   "/possible_pairs/code=:code",
//   async function (request: possiblePairsReq, reply) {
//     reply.header("Access-Control-Allow-Origin", "*");
//     const { code } = request.params;
//     if (code && code.length < 8) {
//       reply.send(
//         JSON.stringify(
//           await db.getData(`.possible_pairs.${code.toUpperCase()}`)
//         )
//       );
//     }
//     reply.send(JSON.stringify(await db.getData(".parser_setting")));
//   }
// );

// server.get("/dir=:dirId/type=:type", async function (request: dirReq, reply) {
//   reply.header("Access-Control-Allow-Origin", "*");
//   const { dirId, type } = request.params;
//   const sendFunction = (data: any) => reply.send(JSON.stringify(data));
//   handleDirRequest(sendFunction, dirId, type);
// });

// // server.get("/websocket", { websocket: true }, (connection) => {
// //   connection.socket.on("message", async (message) => {
// //     const dirId = String(message);
// //     if (dirId && dirId.length < 20 && dirId.includes("_")) {
// //       const res = await handleDirRequest(dirId.toUpperCase());
// //       connection.socket.send(JSON.stringify(res));
// //     } else {
// //       connection.socket.send("wrong request");
// //     }
// //   });
// // });

// const startServer = async () => {
//   try {
//     // HOST IS IMPORTANT, OTHERWISE DOCKER PORT EXPOSE NOT WORKING
//     // await server.listen({
//     //   port: +(process.env.PARSER_PORT || 4800),
//     //   host: "0.0.0.0",
//     // });

//     startWorkers();
//   } catch (error) {
//     mylog(String(error), "error");
//     process.exit(1);
//   }
// };

// startServer();

// export { server };
