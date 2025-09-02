import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Topbar } from "./Toolbar";
import { ColorSelector } from "./Sidebar";
import { IconButton } from "./IconButton";
import { useRouter } from "next/navigation";
import {
    AlignJustify,
    Diamond,
    Eraser,
    Grab,
    Hand,
    Minus,
    Moon,
    MousePointer,
    MousePointer2,
    MoveRight,
    Plus,
    Redo2,
    SquareDashedMousePointer,
    Sun,
    Trash2,
    TypeOutline,
    Undo2,
    UsersRound,
    ZoomIn,
    ZoomOut,
    Circle,
    Pencil,
    Square,
} from "lucide-react";

import { Game } from "@/draw/Game";
import { toast } from "react-toastify";

export type Tool =
    | "circle"
    | "rect"
    | "pencil"
    | "clear"
    | "erase"
    | "undo"
    | "redo"
    | "hand"
    | "point"
    | "text"
    | "select"
    | "line"
    | "arrow"
    | "rhombus";

export type Color =
    | "#7a7a7a"
    | "#ffa6a6"
    | "#a6ffa6"
    | "#a6a6ff"
    | "#ffffa6"
    | "#ffa6ff"
    | "#a6ffff"
    | "#ffffff";

export const colors: Color[] = [
    "#7a7a7a", // Black
    "#ffa6a6", // Red
    "#a6ffa6", // Green
    "#a6a6ff", // Blue
    "#ffffa6", // Yellow
    "#ffa6ff", // Magenta
    "#a6ffff", // Cyan
    "#ffffff", // White
];

export type Theme = "rgb(24, 24, 27)" | "rgb(255, 255, 255)";

export function Canvas({
    roomId,
    socket,
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [zoom, setZoom] = useState(75);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [selectedColor, setSelectedColor] = useState<Color>("#7a7a7a");
    const [theme, setTheme] = useState<Theme>("rgb(255, 255, 255)");
    const [sidebarClicked, setSidebarClicked] = useState(false);
    //const [strokeWidth, setStrokeWidth] = useState<number>(1);


    const handleUndo = () => {
        game?.undo();
    };

    const handleRedo = () => {
        game?.redo();
    };

    const increaseZoom = () => {
        setZoom(zoom + 2);
        game?.inc();
    };

    const decreaseZoom = () => {
        setZoom(zoom - 2);
        game?.dec();
    };

    // Update the canvas cursor when the selected tool changes
    useEffect(() => {
        if (canvasRef.current) {
            if (selectedTool === "text") {
                canvasRef.current.className = "cursor-text";
            }
            const cursorClass = `cursor-${selectedTool}`;
            canvasRef.current.className = cursorClass;
        }
    }, [selectedTool]);

    useEffect(() => {
        game?.setTheme(theme);
    }, [theme, game]);

    useEffect(() => {
        game?.setColor(selectedColor);
    }, [selectedColor, game]);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            };
        }
    }, [canvasRef]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <div
                style={{
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className="custom-cursor bg-zinc-800"
                >
                </canvas>
                <Topbar
                    setSelectedTool={setSelectedTool}
                    selectedTool={selectedTool}
                    setSelectedColor={setSelectedColor}
                    selectedColor={selectedColor}
                    theme={theme}
                    setTheme={setTheme}
                />
                <div
                    style={{
                        position: "fixed",
                        top: 15,
                        left: 15,
                    }}
                >
                    <button
                        onClick={() => {
                            setSidebarClicked((prev) => !prev)
                            setTimeout(() => {
                                setSidebarClicked(false); // Automatically close after 10 seconds
                            }, 10000); // 10 seconds delay
                        }}
                        className={`${
                            theme === "rgb(24, 24, 27)"
                                ? "text-zinc-300 bg-zinc-800"
                                : "text-zinc-600 bg-zinc-100"
                        } p-2 rounded-md`}
                        title="Sidebar"
                    >
                        <AlignJustify size={16} />
                    </button>
                    {sidebarClicked && (
                        <div className={`mt-2 ${theme==="rgb(24, 24, 27)"? "bg-zinc-800" : "bg-zinc-50"} p-2 rounded-md shadow-md`}>
                            <div>
                                <ColorSelector
                                    selectedColor={selectedColor}
                                    setSelectedColor={setSelectedColor}
                                    theme={theme}
                                    setTheme={setTheme}
                                    title="Color"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <p
                                    className={`${
                                        theme === "rgb(24, 24, 27)"
                                            ? "text-zinc-400"
                                            : "text-zinc-600"
                                    } text-sm font-sans`}
                                >
                                    Theme:
                                </p>

                                <div className="flex gap-2 p-1">
                                    <button
                                        className={`${
                                            theme === "rgb(24, 24, 27)"
                                                ? "text-zinc-300"
                                                : "text-zinc-50 bg-yellow-500/60 p-0.5 rounded-sm"
                                        }`}
                                        onClick={()=> setTheme("rgb(255, 255, 255)")}
                                        title="Light"
                                    >
                                        <Sun size={16} />
                                    </button>
                                    <button
                                        className={`${
                                            theme === "rgb(24, 24, 27)"
                                                ? "text-zinc-300 bg-yellow-500/60 p-0.5 rounded-sm"
                                                : "text-zinc-600"
                                        }`}
                                        onClick={()=> setTheme("rgb(24, 24, 27)")}
                                        title="Dark"
                                    >
                                        <Moon size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <>
                {/* Undo/Redo Section */}
                <div
                    style={{
                        position: "fixed",
                        bottom: 21,
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                    className={`${
                        theme === "rgb(24, 24, 27)"
                            ? "bg-zinc-800 text-zinc-300"
                            : "bg-white text-zinc-600"
                    } rounded-md p-2 flex shadow-md items-center justify-center gap-5 max-w-auto sm:bottom-16 sm:left-5 sm:translate-x-0 cursor-pointer`}
                >
                    <button
                        onClick={handleUndo}
                        type="button"
                        className="cursor-pointer hover:text-yellow-400 pl-2"
                        title="Undo"
                    >
                        <Undo2 size={16}/>
                    </button>
                    <span className="text-sm text-zinc-300">|</span>
                    <button
                        onClick={handleRedo}
                        type="button"
                        className="cursor-pointer hover:text-yellow-300 pr-2"
                        title="Redo"
                    >
                        <Redo2 size={16}/>
                    </button>
                </div>

                {/* Zoom Controls */}
                <div
                    style={{
                        padding: "10px",
                        borderRadius: "10px",
                    }}
                    className={`fixed bottom-15 left-10% transform -translate-x-1/2 ${
                        theme === "rgb(24, 24, 27)"
                            ? "bg-zinc-800 text-white/80"
                            : "bg-white text-zinc-500"
                    } shadow-md rounded-lg flex items-center justify-center gap-4 max-w-auto sm:bottom-5 sm:left-5 sm:translate-x-0`}
                >
                    <button
                        onClick={decreaseZoom}
                        type="button"
                        className="pl-4 pr-4 cursor-pointer"
                    >
                        <Minus size={20}/>
                    </button>
                    <p className="text-xs">{zoom}%</p>
                    <button
                        onClick={increaseZoom}
                        type="button"
                        className="pl-4 pr-4 cursor-pointer"
                    >
                        <Plus size={20}/>
                    </button>
                </div>
            </>
        </>
    );
}