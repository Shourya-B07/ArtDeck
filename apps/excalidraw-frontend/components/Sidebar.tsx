import { Color, Theme, Tool } from "@/components/Canvas";
import { useState } from "react";
import { colors } from "@/components/Canvas";
export function ColorSelector({
    selectedColor,
    setSelectedColor,
    theme,
    setTheme,
    title,
}: {
    selectedColor: Color;
    setSelectedColor: (s: Color) => void;
    theme: Theme;
    setTheme: (s: Theme) => void;
    title?: string;
}) { // Default color is zinc
    const [showDropdown, setShowDropdown] = useState(false);

    const handleColorSelect = (color: Color) => {
        setSelectedColor(color);
        setShowDropdown(false);
    };

    return (
        <div className="relative inline-block">
            <div className="flex gap-2 items-center">
                <p
                    className={`${
                        theme === "rgb(24, 24, 27)"
                            ? "text-zinc-400"
                            : "text-zinc-600"
                    } text-sm`}
                >
                    Choose a color:
                </p>
                <button
                    className="p-2 rounded-sm border border-zinc-400"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => setShowDropdown((prev) => !prev)}
                    title={title}
                >
                    {/* The button displays the selected color */}
                </button>
            </div>
            {/* Dropdown to select color */}
            {showDropdown && (
                <div
                    className={`absolute top-full left-0 shadow-md rounded-sm z-10 ${
                        theme === "rgb(24, 24, 27)" ? "bg-zinc-800" : "bg-zinc-50"
                    }`}
                >
                    <ul className="grid grid-cols-4 gap-2 p-2">
                        {colors.map((color) => (
                            <li
                                key={color}
                                className="w-4 h-4 rounded-sm cursor-pointer border border-zinc-400"
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorSelect(color)} // Handle color selection
                                title={color.toString()} // Tooltip to show color hex code
                            >
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}