"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { useSelector } from "react-redux";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Get token from Redux or localStorage
  // @ts-ignore
  let tokenVal = useSelector((state) => state.user.token);
  if (!tokenVal && typeof window !== "undefined") {
    tokenVal = localStorage.getItem("token");
  }

  useEffect(() => {
    if (!tokenVal) return;

    const ws = new WebSocket(`${WS_URL}?token=${tokenVal}`);

    ws.onopen = () => {
      setSocket(ws);
      const data = JSON.stringify({
        type: "join_room",
        roomId: Number(roomId), // ✅ ensure number not string
      });
      console.log("Joining room:", data);
      ws.send(data);
    };

    return () => {
      ws.close();
    };
  }, [roomId, tokenVal]);

  if (!socket) {
    return <div>Connecting to server....</div>;
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
