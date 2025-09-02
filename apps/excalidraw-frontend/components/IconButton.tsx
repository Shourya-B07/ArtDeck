import { ReactNode } from "react";

export function IconButton({
    icon,
    onClick,
    activated,
    className,
    title,
}: {
    icon: ReactNode;
    onClick: () => void;
    activated: boolean;
    className?: string;
    title?: string;
}) {
    return (
        <div
            // style={{
            //     fontSize: "1.5rem",
            // }}
            className={`cursor-pointer rounded-lg p-1.5 hover:bg-zinc ${className} ${
                activated ? "text-yellow-100 bg-yellow-500/60" : "text-zinc-400"
            }`}
            onClick={onClick}
            title={title}
        >
            {icon}
        </div>
    );
}
