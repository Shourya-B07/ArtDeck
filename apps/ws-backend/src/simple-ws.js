const { WebSocket, WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

let users = [];
let chats = [];

function checkUser(token) {
  // Simple token validation for testing
  if (token && token.startsWith("mock-token-")) {
    return token.replace("mock-token-", "");
  }
  return null;
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
    const parsedData = typeof data !== "string" ? JSON.parse(data.toString()) : JSON.parse(data);

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

      // Store in memory
      chats.push({
        id: chats.length + 1,
        roomId,
        message,
        userId,
      });

      // Broadcast to all users in the room
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

  ws.on("close", () => {
    users = users.filter(u => u.ws !== ws);
  });
});

console.log("Simple WebSocket server listening on port 8080");

