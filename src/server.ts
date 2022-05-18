import fastify from "fastify";
import initialLoader from "./initialLoader";
//import handleDirRequest from "./dirs/handleDirRequest";
//import handleWebhookPayload from "./handleWebhookPayload";
import websocket from "fastify-websocket";
import fastifyStatic from "fastify-static";
import getAllRates from "./rates/getAllRates";
import path from "path";
import db from "./db";
import fs from "fs"
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

server.get("/parser_settings", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".parser_setting")));
});

server.get("/exchangers", async function (_, reply) {
  const exchangers = db.getData(".exchangers")
  reply.send(JSON.stringify(exchangers.length ? exchangers : "no active exchangers!"));
});

server.get("/rates", async function (_, reply) {
  const rates = fs.readFileSync(path.resolve(__dirname, "../dbRates.json"), "utf8")
  reply.send(JSON.stringify(JSON.parse(rates).allConvertedRates['ADVCUSD_USDTERC']));
});

server.get("/warnings", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".warnings")));
});

server.get("/errors", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".errors")));
});

// server.post("/webhooks-handler", async function (request, _) {
//   // эта херня слушает вебхуку и срабатывает при апдейте exchangers или parser_setting
//   handleWebhookPayload(request.headers.from as string);
// });

//type myReq = FastifyRequest<{ Params: { dirId: string; isFull: string } }>;

// server.get("/dir=:dirId/full=:isFull", async function (request: myReq, reply) {
//   const { dirId, isFull } = request.params;
//   if (dirId && dirId.length < 20 && dirId.includes("_")) {
//     const convertedDirRates = await handleDirRequest(dirId.toUpperCase());
//     const res =
//       isFull === "true"
//         ? convertedDirRates?.rates
//         : {
//             bestRates: convertedDirRates?.bestRates,
//             uniqueRates: convertedDirRates?.uniqueRates,
//           };
//     reply.send(JSON.stringify(res));
//   } else {
//     reply.send("wrong request");
//   }
// });

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
    //bulkStatusChange("suspended", "active")
    await initialLoader();
    getAllRates()
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}; 

start();

export { server };
