import { Color, Theme, Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
} | {
    type: "text";
    x: number;
    y: number;
    content: string;
} | {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
} | {
    type: "rhombus";
    x: number;
    y: number;
    width: number;
    height: number;
} | null;

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private scale: number = 1;
    private panX: number = 0;
    private panY: number = 0;
    private selectedTool: Tool = "circle";
    private selectedColor: Color = "#7a7a7a";
    private theme: Theme = "rgb(255, 255, 255)";
    private undoStack: Shape[][];
    private redoStack: Shape[][];

    private isDragging: boolean;
    private shapeSelect: Shape;
    private pathErase: [number, number][]; // Array of points to erase
    private lastMousePosition: { x: number; y: number };
    private canvasOffset: { x: number; y: number };

    socket: WebSocket;

    private tempLine:
        | { x1: number; y1: number; x2: number; y2: number }
        | null = null;
    private tempRhombus:
        | { x: number; y: number; width: number; height: number }
        | null = null;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.fillStyle = this.theme.toString();
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        this.undoStack = [];
        this.redoStack = [];
        this.shapeSelect = null;
        this.pathErase = [];
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.isDragging = false;
        this.lastMousePosition = { x: 0, y: 0 };
        this.canvasOffset = { x: 0, y: 0 };
    }

    private saveState() {
        this.undoStack.push([...this.existingShapes]);
        this.redoStack.length = 0; // Clear redo stack on new action
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push([...this.existingShapes]);
            this.existingShapes = this.undoStack.pop()!;
            this.clearCanvas();
        }

        alert("undo");
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push([...this.existingShapes]);
            this.existingShapes = this.redoStack.pop()!;
            this.clearCanvas();
        }

        alert("redo");
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);

        this.canvas.removeEventListener("wheel", this.zoomHandler);
    }

    setTool(
        tool:
            | "circle"
            | "pencil"
            | "rect"
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
            | "rhombus",
    ) {
        this.selectedTool = tool;
    }

    setColor(
        color:
            | "#7a7a7a"
            | "#ffa6a6"
            | "#a6ffa6"
            | "#a6a6ff"
            | "#ffffa6"
            | "#ffa6ff"
            | "#a6ffff"
            | "#ffffff",
    ) {
        this.selectedColor = color;
        if (this.ctx) {
            this.ctx.strokeStyle = color;
            //this.ctx.fillStyle = color;
        }
    }

    setTheme(
        theme:
            | "rgb(255, 255, 255)"
            | "rgb(24, 24, 27)",
    ) {
        this.theme = theme;
        if (this.ctx) {
            this.ctx.fillStyle = this.theme === "rgb(24, 24, 27)"
                ? "rgb(24,24,27)"
                : "rgb(255,255,255)";
            this.ctx.strokeStyle = this.theme === "rgb(255, 255, 255)"
                ? "#000000"
                : "#ffffff";
        }
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        //console.log(this.existingShapes);
        this.clearCanvas();
    }

    inc() {
        this.scale += 0.2;
        this.clearCanvas();
    }

    dec() {
        this.scale -= 0.2;
        this.clearCanvas();
    }

    zoomHandler = (e: WheelEvent) => {
        e.preventDefault();

        const scaleAmount = -e.deltaY / 200;
        const newScale = this.scale * (1 + scaleAmount);
        if (newScale < 0.1 || newScale > 5) return;

        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;

        const canvasMouseX = (mouseX - this.panX) / this.scale;
        const canvasMouseY = (mouseY - this.panY) / this.scale;

        this.panX -= canvasMouseX * newScale - canvasMouseX * this.scale;
        this.panY -= canvasMouseY * newScale - canvasMouseY * this.scale;

        this.scale = newScale;
        this.clearCanvas();
    };

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape.shape);
                this.clearCanvas();
            }
        };
    }

    drawShape(shape: Shape) {
        this.ctx.strokeStyle = this.selectedColor.toString();
        switch (shape?.type) {
            case "rect":
                this.drawRect(shape);
                break;
            case "circle":
                this.drawCircle(shape);
                break;
            case "pencil":
                this.drawPencil(shape);
                break;
            case "text":
                this.drawText(shape);
                break;
            case "line":
                this.drawLine(shape);
                break;
            case "rhombus":
                this.drawRhombus(shape);
                break;
        }
    }

    drawRect(shape: Shape) {
        if (shape?.type === "rect") {
            this.ctx.strokeStyle = this.selectedColor.toString();
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
    }

    drawRhombus(shape: Shape) {
        if (shape?.type === "rhombus") {
            this.ctx.strokeStyle = this.selectedColor.toString();
            this.ctx.beginPath();

            // Calculate the diamond points based on the shape's width and height
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;

            this.ctx.moveTo(centerX, shape.y); // Top point
            this.ctx.lineTo(shape.x + shape.width, centerY); // Right point
            this.ctx.lineTo(centerX, shape.y + shape.height); // Bottom point
            this.ctx.lineTo(shape.x, centerY); // Left point
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    drawLine(shape: Shape) {
        if (shape?.type === "line") {
            this.ctx.strokeStyle = this.selectedColor.toString();
            this.ctx.beginPath();
            this.ctx.moveTo(shape.x1, shape.y1);
            this.ctx.lineTo(shape.x2, shape.y2);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    drawText(shape: Shape) {
        if (shape?.type === "text") {
            this.ctx.font = "14px Arial"; // Customize font as needed
            this.ctx.fillStyle = this.theme.toString();
            this.ctx.fillText(shape.content, shape.x, shape.y);
        }
    }

    drawCircle(shape: Shape) {
        if (shape?.type === "circle") {
            this.ctx.strokeStyle = this.selectedColor.toString();
            this.ctx.beginPath();
            this.ctx.arc(
                shape.centerX,
                shape.centerY,
                Math.abs(shape.radius),
                0,
                Math.PI * 2,
            );
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    drawPencil(shape: Shape) {
        if (shape?.type === "pencil") {
            this.ctx.strokeStyle = this.selectedColor.toString();
            const points = shape.points;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            points.forEach((point) => this.ctx.lineTo(point.x, point.y));
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(
            this.scale,
            0,
            0,
            this.scale,
            this.panX,
            this.panY,
        );

        this.ctx.clearRect(
            -this.panX / this.scale,
            -this.panY / this.scale,
            this.canvas.width / this.scale,
            this.canvas.height / this.scale,
        );
        this.ctx.fillStyle = this.theme.toString();
        this.ctx.fillRect(
            -this.panX / this.scale,
            -this.panY / this.scale,
            this.canvas.width / this.scale,
            this.canvas.height / this.scale,
        );
        this.ctx.restore();
        this.existingShapes.map((shape) => {
            if (!shape) return;
            switch (shape.type) {
                case "rect":
                    this.drawRect(shape);
                    break;
                case "circle":
                    this.drawCircle(shape);
                    break;
                case "pencil":
                    this.drawPencil(shape);
                    break;
                case "line":
                    this.drawLine(shape);
                    break;
                case "rhombus":
                    this.drawRhombus(shape);
                    break;
            }
        });
    }

    mouseDownHandler = (e: MouseEvent) => {
        if (this.selectedTool === "text") {
            const x = (e.clientX - this.panX) / this.scale;
            const y = (e.clientY - this.panY) / this.scale;

            // Create a temporary input element
            const input = document.createElement("input");
            input.type = "text";
            input.style.position = "absolute";
            input.style.left = `${e.clientX}px`;
            input.style.top = `${e.clientY}px`;
            input.style.fontSize = "14px";
            input.style.zIndex = "1000";

            // Append the input to the body
            document.body.appendChild(input);

            input.focus();

            // When the user finishes typing, save the text and draw it on the canvas
            input.addEventListener("blur", () => {
                const content = input.value;
                document.body.removeChild(input);

                if (content.trim() !== "") {
                    const shape: Shape = { type: "text", x, y, content };
                    this.existingShapes.push(shape);

                    this.socket.send(JSON.stringify({
                        type: "chat",
                        message: JSON.stringify({ shape }),
                        roomId: this.roomId,
                    }));

                    this.saveState();
                    this.clearCanvas();
                }
            });

            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    input.blur(); // Trigger the blur event to save and remove the input
                }
            });
            return;
        }
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        if (this.selectedTool === "pencil") {
            this.existingShapes.push({
                type: "pencil",
                points: [{ x: e.clientX, y: e.clientY }],
            });
        } else if (this.selectedTool === "erase") {
            this.pathErase.push([e.clientX, e.clientY]);
        } else if (this.selectedTool === "hand") {
            this.isDragging = true;
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        } else if (this.selectedTool === "line") {
            // complete the logic
            this.existingShapes.push({
                type: "line",
                x1: this.startX,
                y1: this.startY,
                x2: e.clientX,
                y2: e.clientY,
            })
        }
    };
    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        const width = (e.clientX - this.startX) / this.scale;
        const height = (e.clientY - this.startY) / this.scale;
        let shape: Shape | null = null;
        if (this.selectedTool === "hand") {
            this.isDragging = false;
        } else if (this.selectedTool === "rect") {
            shape = {
                type: "rect",
                x: (this.startX - this.panX) / this.scale,
                y: (this.startY - this.panY) / this.scale,
                height,
                width,
            };
        } else if (this.selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: ((this.startX - this.panX) / this.scale) + radius,
                centerY: ((this.startY - this.panY) / this.scale) + radius,
            };
        } else if (this.selectedTool === "pencil") {
            const currentShape =
                this.existingShapes[this.existingShapes.length - 1];
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: currentShape }),
                roomId: this.roomId,
            }));
        } else if (this.selectedTool === "clear") {
            this.existingShapes = [];
            this.clearCanvas();
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ action: "clear" }),
                roomId: this.roomId,
            }));
        } else if (this.selectedTool === "line") {
            shape = {
                type: "line",
                x1: (this.startX - this.panX) / this.scale,
                y1: (this.startY - this.panY) / this.scale, 
                x2: e.clientX,
                y2: e.clientY,
            };
        } else if (this.selectedTool === "rhombus") {
            shape = {
                type: "rhombus",
                x: (Math.min(this.startX, e.clientX) - this.panX) / this.scale,
                y: (Math.min(this.startY, e.clientY) - this.panY) / this.scale,
                width: Math.abs(e.clientX - this.startX) / this.scale,
                height: Math.abs(e.clientY - this.startY) / this.scale,
            };
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);
        this.pathErase = [];
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape,
            }),
            roomId: this.roomId,
        }));
        this.saveState();
    };
    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked && this.selectedTool === "hand" && this.isDragging) {
            const dx = e.clientX - this.lastMousePosition.x;
            const dy = e.clientY - this.lastMousePosition.y;

            // Update canvas offset
            this.canvasOffset.x += dx;
            this.canvasOffset.y += dy;

            // Apply translation to canvas
            this.ctx.translate(dx, dy);

            // Redraw shapes with the new offset
            this.clearCanvas();

            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        }
        if (this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            //console.log(`Mouse Move: X: ${currentX}, Y: ${currentY}`);
            this.clearCanvas();
            if (this.selectedTool === "rect") {
                
                this.drawRect({
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    width: width,
                    height: height,
                });
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                this.drawCircle({
                    type: "circle",
                    centerX: this.startX + radius,
                    centerY: this.startY + radius,
                    radius,
                });
            } else if (this.selectedTool === "pencil") {
                const currentShape =
                    this.existingShapes[this.existingShapes.length - 1];
                if (currentShape && currentShape.type === "pencil") {
                    currentShape.points.push({ x: e.clientX, y: e.clientY });
                    this.drawPencil(currentShape);
                }
            } else if (this.selectedTool === "select" && this.shapeSelect) {
                if (this.shapeSelect.type === "rect") {
                    const x1 = (2 * e.clientX - this.shapeSelect.width) / 2;
                    const y1 = (2 * e.clientY - this.shapeSelect.height) / 2;
                    this.shapeSelect.x = x1;
                    this.shapeSelect.y = y1;
                } else if (this.shapeSelect.type === "circle") {
                    this.shapeSelect.centerX = e.clientX;
                    this.shapeSelect.centerY = e.clientY;
                }
            } else if (this.selectedTool === "erase") {
                this.pathErase.push([e.clientX, e.clientY]);
            }
            if (this.selectedTool === "line") {
                this.clearCanvas();
                this.drawLine({
                    type: "line",
                    x1: this.startX,
                    y1: this.startY,
                    x2: e.clientX,
                    y2: e.clientY,
                });
            } else if (this.selectedTool === "rhombus") {
                this.clearCanvas();
                this.drawRhombus({
                    type: "rhombus",
                    x: Math.min(this.startX, e.clientX),
                    y: Math.min(this.startY, e.clientY),
                    width: Math.abs(e.clientX - this.startX),
                    height: Math.abs(e.clientY - this.startY),
                });
            }
        }
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);

        this.canvas.addEventListener("mouseup", this.mouseUpHandler);

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);

        this.canvas.addEventListener("wheel", this.zoomHandler);
    }
}
