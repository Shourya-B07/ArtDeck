const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

let users = [];
let rooms = [];
let chats = [];

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    res.status(409).json({ message: "User already exists" });
    return;
  }

  const user = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password,
    name,
  };
  
  users.push(user);
  res.status(201).json({ userId: user.id });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    res.status(403).json({ message: "Invalid email or password" });
    return;
  }

  const token = "mock-token-" + user.id;
  res.status(200).json({
    username: user.name,
    userId: user.id,
    token,
  });
});

app.post("/room", async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  const existingRoom = rooms.find(r => r.slug === name);
  if (existingRoom) {
    res.status(409).json({ message: "Room already exists" });
    return;
  }

  const room = {
    id: rooms.length + 1,
    slug: name,
    adminId: "mock-admin",
    createdAt: new Date(),
  };
  
  rooms.push(room);
  res.status(201).json({ roomId: room.id });
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  
  if (isNaN(roomId)) {
    res.status(400).json({ message: "Invalid roomId" });
    return;
  }

  const roomChats = chats.filter(c => c.roomId === roomId);
  res.json({ messages: roomChats });
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = rooms.find(r => r.slug === slug);

  if (!room) {
    res.status(404).json({ message: "Room not found" });
    return;
  }

  res.json({ room });
});

app.listen(4001, () => console.log("Simple HTTP backend listening on port 4001"));

