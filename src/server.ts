import fastify, { FastifyRequest } from "fastify";
import initialLoader from "./initialLoader";
import handleDirRequest from "./dirs/handleDirRequest";
import websocket from "fastify-websocket";
import fastifyStatic from "fastify-static";
import getAllRates from "./rates/getAllRates";
import path from "path";
import db from "./db";

const server = fastify();
server.register(websocket);
server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/public/",
});

console.log(path.join(__dirname));

server.get("/", async function (_, reply) {
  reply.sendFile("menu.html");
});

server.get("/preferences", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".preferences")));
});

server.get("/exchangers", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".exchangers")));
});

server.get("/dirs", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".dirs")));
});

server.get("/warnings", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".warnings")));
});

server.get("/errors", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".errors")));
});

type myReq = FastifyRequest<{ Params: { dirId: string; isFull: string } }>;

server.get("/dir=:dirId/full=:isFull", async function (request: myReq, reply) {
  const { dirId, isFull } = request.params;
  if (dirId && dirId.length < 20 && dirId.includes("_")) {
    const convertedDirRates =
      db.getData(".allConvertedRates")[dirId] ??
      (await handleDirRequest(dirId.toUpperCase()));
    const res =
      isFull === "true"
        ? convertedDirRates?.rates
        : {
            bestRates: convertedDirRates?.bestRates,
            uniqueRates: convertedDirRates?.uniqueRates,
          };
    reply.send(JSON.stringify(res));
  } else {
    reply.send("wrong request");
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
    console.log("started");
    await server.listen(process.env.PORT || 5000, "0.0.0.0");
    await initialLoader();
    setInterval(getAllRates, db.getData(".preferences.update_time_sec") * 1000);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();

export { server };
