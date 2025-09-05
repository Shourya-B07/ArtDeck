"use client";

import { PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";

export default function CreateRoomPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const createRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to create a room");
      router.push("/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${HTTP_BACKEND}/room`,
        { name: formData.name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const roomId = response.data?.roomId;

      if (!roomId || isNaN(Number(roomId))) {
        throw new Error("Invalid roomId returned from server");
      }

      toast.success("Room created successfully");
      router.push(`/canvas/${roomId}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Server Error:", error.response.data);

          if (error.response.status === 403) {
            toast.error("Unauthorized. Please log in again.");
            router.push("/signin");
          } else if (error.response.status === 409) {
            toast.error("Room already exists with this name.");
          } else {
            toast.error(
              error.response.data?.message || "Something went wrong on the server"
            );
          }
        } else if (error.request) {
          console.error("No response received:", error.request);
          toast.error("Server did not respond. Please try again later.");
        } else {
          console.error("Axios setup error:", error.message);
          toast.error("Request setup failed.");
        }
      } else {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-t from-yellow-900 to-white via-yellow-300 dark:from-zinc-950 dark:to-yellow-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <PencilRuler
            className="h-8 w-auto text-yellow-600 dark:text-yellow-400 cursor-pointer float-right"
            onClick={() => router.push("/")}
          />
          <h1 className="text-2xl font-bold text-zinc-800">
            Create a room and collaborate
          </h1>
        </div>

        <form onSubmit={createRoom}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700"
            >
              Room Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border text-zinc-800 border-zinc-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              placeholder="Enter room name"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none sm:text-sm font-medium"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-zinc-700">
            Want to join a room?{" "}
            <a className="underline" href="/join-room">
              Join room
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
