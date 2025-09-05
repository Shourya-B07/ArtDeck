import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import cors from "cors";

const allowedOrigins = ["http://localhost:3000"];

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.email,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });

    res.status(201).json({ userId: user.id });
  } catch (e) {
    res.status(409).json({ message: "User already exists" });
  }
});

app.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  const user = await prismaClient.user.findFirst({
    where: { email: parsedData.data.email },
  });

  if (!user) {
    res.status(403).json({ message: "Invalid email or password" });
    return;
  }

  const isPasswordCorrect = await bcrypt.compare(
    parsedData.data.password,
    user.password
  );
  if (!isPasswordCorrect) {
    res.status(403).json({ message: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);

  res.status(200).json({
    username: user.name,
    userId: user.id,
    token,
  });
});

app.post("/room", middleware, async (req: Request, res: Response): Promise<void> => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Incorrect inputs" });
    return;
  }

  // @ts-ignore
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });

    res.status(201).json({ roomId: room.id });
  } catch (e) {
    res.status(409).json({ message: "Room already exists" });
  }
});

app.get("/chats/:roomId", async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = Number(req.params.roomId);
    if (isNaN(roomId)) {
      res.status(400).json({ message: "Invalid roomId" });
      return;
    }

    const messages = await prismaClient.chat.findMany({
      where: { roomId },
      orderBy: { id: "desc" },
      take: 100,
    });

    res.json({ messages });
  } catch (e) {
    res.status(500).json({ messages: [] });
  }
});

app.get("/room/:slug", async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  const room = await prismaClient.room.findFirst({ where: { slug } });

  if (!room) {
    res.status(404).json({ message: "Room not found" });
    return;
  }

  res.json({ room });
});

app.listen(4001, () => console.log("http-backend listening on port 4001"));
