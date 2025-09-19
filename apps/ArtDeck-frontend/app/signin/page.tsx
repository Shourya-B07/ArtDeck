"use client";

import { PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useDispatch } from "react-redux";
import { HTTP_BACKEND } from "@/config";
import {
  setSession,
  setToken,
  setUserId,
  setUsername,
} from "@repo/store/userSlice";

export default function SigninPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.email.trim() && formData.password.trim()) {
      try {
        const data = {
          email: formData.email.trim(),
          password: formData.password,
        };

        const response = await axios.post(`${HTTP_BACKEND}/signin`, data);

        if (response.status === 200) {
          const { username, userId, token } = response.data;

          // Save in Redux
          dispatch(setUsername(username));
          dispatch(setUserId(userId));
          dispatch(setToken(token));
          dispatch(setSession(true));

          // Save token in localStorage
          localStorage.setItem("token", token);

          toast.success("Logged in successfully");
          router.push("/create-room");
        } else {
          toast.error("Invalid credentials");
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error("Backend error:", error.response?.data);
          toast.error(error.response?.data?.message || "Login failed");
        } else {
          console.error("Unexpected error:", error);
          toast.error("Something went wrong, please try again");
        }
      }
    } else {
      toast.warn("Please fill all fields");
    }
  };

  return (
    <div className="bg-gradient-to-t from-yellow-900 to-white via-yellow-300 dark:from-zinc-950 dark:to-yellow-900 min-h-screen flex items-center justify-center">
      <div className="absolute top-4 right-4 p-4 cursor-pointer">
        <PencilRuler
          className="h-8 w-auto text-yellow-600 dark:text-yellow-400"
          onClick={() => router.push("/")}
        />
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800">
            Sign in to your account
          </h1>
          <p className="text-zinc-600 text-sm mt-2">
            Don't have an account?{" "}
            <span
              className="cursor-pointer underline"
              onClick={() => router.push("/signup")}
            >
              Register
            </span>
          </p>
        </div>

        <form className="mt-6" onSubmit={login}>
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="mt-1 block w-full px-3 py-2 text-zinc-900 border border-zinc-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="mt-1 block w-full px-3 py-2 text-zinc-900 border border-zinc-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none sm:text-sm font-medium"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
