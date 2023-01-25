import SuperJSON from "superjson";
import WebSocket from "ws";
import { Message, MessageType, validate, WSMessage } from "./types";

export class Chat {
    private rooms: Map<string, WebSocket[]>;

    constructor(private useZod: boolean, private useSuperJson: boolean) {
        this.rooms = new Map();
    }

    push(ws: WebSocket) {
        this.listen(ws);
    }

    private listen(ws: WebSocket) {
        ws.on("message", msg => {
            const text = msg.toString();

            // SUPERJSON
            let parsed: WSMessage;
            if (this.useSuperJson) {
                parsed = SuperJSON.parse(text);
            } else {
                parsed = JSON.parse(text);
            }

            // ZOD
            if (this.useZod && !validate(parsed)) {
                // updating the users in the chat rooms
                this.disconnect(ws);
            }

            this.processMessage(ws, parsed);
        });

        ws.on("error", e => {
            console.error("there was an error for socket", e);
            this.disconnect(ws);
        });

        ws.on("close", () => {
            this.disconnect(ws);
        });
    }

    private disconnect(ws: WebSocket) {
        ws.removeAllListeners();

        for (const [_, v] of this.rooms) {
            const idx = v.indexOf(ws);
            if (idx >= 0) {
                v.splice(idx, 1);
            }
        }

    }

    private processMessage(ws: WebSocket, msg: WSMessage) {
        if (msg.type === MessageType.Message) {

            let sockets: WebSocket[] = [];

            msg.msg.group.forEach(roomName => {
                const room = this.rooms.get(roomName);
                if (!room) {
                    return;
                }

                room.forEach(socket => {
                    if (!sockets.includes(socket)) {
                        sockets.push(socket);
                    }
                });

                this.pushMessage(msg, sockets);
            });
        } else if (msg.type === MessageType.Leave) {
            msg.leave.forEach(roomName => {
                const room = this.rooms.get(roomName);
                if (room) {
                    const idx = room.indexOf(ws);
                    if (~idx) {
                        room.splice(idx, 1);
                    }
                }
            });
        } else if (msg.type === MessageType.Join) {
            msg.join.forEach(roomName => {
                let room = this.rooms.get(roomName);
                if (!room) {
                    room = [];
                    this.rooms.set(roomName, room);
                }

                room.push(ws);
            });
        }
    }

    private stringify(msg: any): string {
        if (this.useSuperJson) {
            return SuperJSON.stringify(msg);
        }
        return JSON.stringify(msg);
    }

    private pushMessage(message: Message, sockets: WebSocket[]) {

        const msg = this.stringify(message);

        sockets.forEach(s => {
            s.send(msg);
        });
    }
}

