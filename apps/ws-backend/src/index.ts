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

  // Handle connection cleanup
  ws.on("close", function close() {
    const userIndex = users.findIndex((x) => x.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
      console.log(`User ${userId} disconnected`);
    }
  });

  ws.on("error", function error(err) {
    console.error(`WebSocket error for user ${userId}:`, err);
  });

  ws.on("message", async function message(data) {
    try {
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

      try {
        // Parse the message to check the action
        const messageData = JSON.parse(message);
        
        if (messageData.action === "delete") {
          // Handle delete action - remove shapes from database
          if (messageData.shapeId) {
            // Delete by shape ID
            await prismaClient.chat.deleteMany({
              where: {
                roomId: roomId,
                message: {
                  contains: `"id":"${messageData.shapeId}"`
                }
              }
            });
            console.log(`Deleted shape with ID: ${messageData.shapeId} from room ${roomId}`);
          } else if (messageData.shape) {
            // Delete by shape content (fallback)
            const shapeString = JSON.stringify(messageData.shape);
            await prismaClient.chat.deleteMany({
              where: {
                roomId: roomId,
                message: {
                  contains: shapeString
                }
              }
            });
            console.log(`Deleted shape by content from room ${roomId}`);
          }
        } else if (messageData.action === "clear") {
          // Handle clear action - remove all shapes from the room
          await prismaClient.chat.deleteMany({
            where: {
              roomId: roomId
            }
          });
          console.log(`Cleared all shapes from room ${roomId}`);
        } else {
          // Handle create action - save new shape to database
          await prismaClient.chat.create({
            data: {
              roomId,
              message,
              userId,
            },
          });
          console.log(`Created new shape in room ${roomId}`);
        }
      } catch (parseError) {
        // If message is not valid JSON, treat it as a regular message
        console.warn("Failed to parse message, treating as regular message:", parseError);
        await prismaClient.chat.create({
          data: {
            roomId,
            message,
            userId,
          },
        });
      }

      // Broadcast the message to all users in the room
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
    } catch (error) {
      console.error(`Error processing message from user ${userId}:`, error);
    }
  });
});
