import ws from "ws";
import { Chat } from "./chat";

const port = +process.argv[2] || 42068;
const useZod = process.argv[3] === undefined ? true : process.argv[3] ===  "true";
const sjson = process.argv[4] === undefined ? true : process.argv[4] ===  "true";
const chat = new Chat(useZod, sjson);
const server = new ws.Server({
    host: "0.0.0.0",
    port,
});

// 3 messages
// 1. join
// 2. leave
// 3. msg

server.on("connection", c => {
    chat.push(c);
});

server.on("error", (e) => {
    console.log("server error", e);
    process.exit(1);
});

server.on("close", () => {
    console.log("server close");
    process.exit(1);
});



