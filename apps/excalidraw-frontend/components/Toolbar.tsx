import { useState } from "react";
import { toast } from "react-toastify";
import { IconButton } from "./IconButton";
import { Color, Theme, Tool } from "@/components/Canvas";
import {
    AlignJustify,
    Circle,
    Diamond,
    Eraser,
    Grab,
    Hand,
    Minus,
    Moon,
    MousePointer,
    MousePointer2,
    MoveRight,
    Pencil,
    Plus,
    Redo2,
    Square,
    SquareDashedMousePointer,
    Sun,
    Trash2,
    TypeOutline,
    Undo2,
    UsersRound,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
export function Topbar(
    {
        selectedTool,
        setSelectedTool,
        selectedColor,
        setSelectedColor,
        theme,
        setTheme,
    }: {
        selectedTool: Tool;
        setSelectedTool: (s: Tool) => void;
        selectedColor: Color;
        setSelectedColor: (s: Color) => void;
        theme: Theme;
        setTheme: (s: Theme) => void;
    },
) {
    const [isCopied, setIsCopied] = useState(false);
    const [collaborativeMode, setCollaborativeMode] = useState(false);

    const handleCopy = () => {
        const currentUrl = window.location.href; // Get the current URL
        navigator.clipboard.writeText(currentUrl) // Copy URL to clipboard
            .then(() => {
                toast.success("URL copied to clipboard!");
                setIsCopied(true); // Set the copied state to true
                setCollaborativeMode(true);
                setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
            })
            .catch((err) => console.error("Failed to copy URL:", err));
    };
    return (
        <>
            {/* Main Toolbar */}
            <div
                style={{
                    position: "fixed",
                    top: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
                className={`${
                    theme === "rgb(24, 24, 27)" ? "bg-zinc-800" : "bg-white"
                } flex gap-2 items-center justify-center shadow-lg bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-90 rounded-lg px-4 py-1 text-xs font-mono sm:flex-wrap sm:justify-start sm:left-5 sm:top-5`}
            >
                {/* Tool Icons */}
                <IconButton
                    onClick={() => {
                        setSelectedTool("point");
                    }}
                    activated={selectedTool === "point"}
                    icon={<MousePointer2 size={20} />}
                    className="hidden sm:inline-block"
                    title="Pointer"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("select");
                    }}
                    activated={selectedTool === "select"}
                    icon={<SquareDashedMousePointer size={20} />}
                    className="hidden sm:inline-block"
                    title="Select"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("hand");
                    }}
                    activated={selectedTool === "hand"}
                    icon={<Hand size={20} />}
                    title="Grab"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("rect");
                    }}
                    activated={selectedTool === "rect"}
                    icon={<Square size={20} />}
                    title="Rectangle"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("rhombus");
                    }}
                    activated={selectedTool === "rhombus"}
                    icon={<Diamond size={20} />}
                    title="Rhombus"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("circle");
                    }}
                    activated={selectedTool === "circle"}
                    icon={<Circle size={20} />}
                    title="Circle"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("line");
                    }}
                    activated={selectedTool === "line"}
                    icon={<Minus size={20} />}
                    title="Line"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("arrow");
                    }}
                    activated={selectedTool === "arrow"}
                    icon={<MoveRight size={20} />}
                    title="Arrow"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("pencil");
                    }}
                    activated={selectedTool === "pencil"}
                    icon={<Pencil size={20} />}
                    title="Pencil"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("erase");
                    }}
                    activated={selectedTool === "erase"}
                    icon={<Eraser size={20} />}
                    title="Erase"
                />

                <IconButton
                    onClick={() => {
                        setSelectedTool("text");
                    }}
                    activated={selectedTool === "text"}
                    icon={<TypeOutline size={20} />}
                    className="hidden sm:inline-block"
                    title="Text"
                />

                <span className="opacity-50 text-zinc-300">|</span>

                <IconButton
                    onClick={() => {
                        setSelectedTool("clear");
                    }}
                    activated={selectedTool === "clear"}
                    icon={<Trash2 size={20} />}
                    title="Clear canvas"
                />
                {/* Collaboration Button */}
                <button
                    onClick={handleCopy}
                    className={`p-2 rounded-md ${
                        collaborativeMode ? "bg-green-500" : "bg-none"
                    } transition-colors duration-300`}
                    title="Collaborative mode"
                >
                    <UsersRound
                        size={16}
                        className={`${
                            theme === "rgb(24, 24, 27)"
                                ? "text-zinc-300"
                                : "text-zinc-300"
                        }`}
                    />
                </button>
            </div>
        </>
    );
}
