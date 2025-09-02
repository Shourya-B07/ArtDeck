"use client";
import { PencilRuler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
export default function SigninPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        roomId: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const joinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.roomId) {
            try {
                router.push("/canvas/"+formData.roomId);
                toast.success("Joined the room successfully");
            } catch (error) {
                console.log(error);
                toast.error("Something went wrong");
            }
        }
    };
    return (
        <>
            <div className="bg-gradient-to-t from-yellow-900 to-white via-yellow-300 dark:from-zinc-950 dark:to-yellow-900">
                <div className="absolute top-50 right-50 p-4 cursor-pointer">
                    <PencilRuler
                        className="h-8 w-auto text-yellow-600 dark:text-yellow-400"
                        onClick={() => {
                            router.push("/");
                        }}
                    />
                </div>
                <div className="flex min-h-screen items-center justify-center">
                    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-zinc-800">
                                Join a room and collaborate
                            </h1>
                        </div>
                        <div className="text-center mt-1">
                            <p className="text-sm text-zinc-500 font-light">(Ask your friend to share the room ID)</p>
                        </div>
                        <form className="mt-6" onSubmit={joinRoom}>
                            <div className="mb-4">
                                <label
                                    htmlFor="roomId"
                                    className="block text-md font-medium text-zinc-700"
                                >
                                    Enter room ID
                                </label>
                                <input
                                    type="text"
                                    id="roomId"
                                    name="roomId"
                                    value={formData.roomId}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border text-zinc-800 border-zinc-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none sm:text-sm font-medium"
                                >
                                    Join room
                                </button>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-zinc-700">Want to create a room? <a className="underline" href="/create-room">Create room</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}