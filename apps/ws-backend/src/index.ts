import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  users.push({ userId, rooms: [], ws });

  ws.on("message", async function message(data) {
    const parsedData =
      typeof data !== "string" ? JSON.parse(data.toString()) : JSON.parse(data);

    if (parsedData.type === "join_room") {
      const roomId = Number(parsedData.roomId);
      if (isNaN(roomId)) {
        console.error("Invalid roomId received:", parsedData.roomId);
        return;
      }
      const user = users.find((x) => x.ws === ws);
      if (user && !user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
      }
    }

    if (parsedData.type === "leave_room") {
      const roomId = Number(parsedData.roomId);
      if (isNaN(roomId)) return;
      const user = users.find((x) => x.ws === ws);
      if (user) {
        user.rooms = user.rooms.filter((x) => x !== roomId);
      }
    }

    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const message = parsedData.message;

      if (isNaN(roomId)) {
        console.error("Invalid roomId for chat:", parsedData.roomId);
        return;
      }

      await prismaClient.chat.create({
        data: {
          roomId,
          message,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message,
              roomId,
            })
          );
        }
      });
    }
  });
});
