import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.get("/health", (_, res) => res.status(200).send("ok"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/media" });

wss.on("connection", (ws, req) => {
  console.log("WS connected:", req.url);
  let streamSid = null;

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.event === "start") {
        streamSid = data.start.streamSid;
        console.log("stream started:", streamSid);
      }
      // Echo back audio (proof the stream works)
      if (data.event === "media" && streamSid && data.media?.payload) {
        ws.send(JSON.stringify({
          event: "media",
          streamSid,
          media: { payload: data.media.payload }
        }));
      }
      if (data.event === "stop") console.log("stream stopped:", streamSid);
    } catch (e) { console.error("bad WS message", e); }
  });

  ws.on("close", () => console.log("WS closed:", streamSid));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("listening on", PORT));
