"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { useSelector } from "react-redux";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get token from Redux or localStorage
  let tokenVal = useSelector((state: any) => state.user?.token);
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
        roomId: Number(roomId),
      });
      console.log("Joining room:", data);
      ws.send(data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionError("Failed to connect to server. Please check your connection.");
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setSocket(null);
      if (event.code !== 1000) { // Not a normal closure
        setConnectionError("Connection lost. Please refresh the page.");
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, tokenVal]);

  if (connectionError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center p-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Connection Error
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
