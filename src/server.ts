import fastify, { FastifyRequest } from "fastify";
import preferencesLoader from "./preferencesLoader";
import handleDirRequest from "./dirs/handleDirRequest";
import websocket from "fastify-websocket";
import db from "./db";

const server = fastify();
server.register(websocket);

const allRoutes = {
  routes: ["/rates", "/dirs", "/preferences", "/problematic"],
};

server.get("/", async function (_, reply) {
  reply.send(JSON.stringify(allRoutes));
});

server.get("/preferences", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".preferences")));
});

server.get("/problematic", async function (_, reply) {
  reply.send(JSON.stringify(db.getData(".problematicRates")));
});

type myReq = FastifyRequest<{ Params: { dirId: string } }>;

server.get("/rate=:dirId", async function (request: myReq, reply) {
  const { dirId } = request.params;
  if (dirId && dirId.length < 20 && dirId.includes("_")) {
    const res = await handleDirRequest(dirId.toUpperCase());
    reply.send(JSON.stringify(res));
  } else {
    reply.send("wrong request");
  }
});

server.get("/websocket", { websocket: true }, (connection) => {
  connection.socket.on("message", async (message) => {
    const dirId = String(message);
    if (dirId && dirId.length < 20 && dirId.includes("_")) {
      const res = await handleDirRequest(dirId.toUpperCase());
      connection.socket.send(JSON.stringify(res));
    } else {
      connection.socket.send("wrong request");
    }
  });
});

const start = async () => {
  try {
    await server.listen(process.env.PORT || 5000, "0.0.0.0");
    await preferencesLoader();
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();

export { server };
