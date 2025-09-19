import { Color, Theme, Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type BaseShape = { id?: string; messageId?: number };
type Shape =
    | (BaseShape & {
          type: "rect";
          x: number;
          y: number;
          width: number;
          height: number;
      })
    | (BaseShape & {
          type: "circle";
          centerX: number;
          centerY: number;
          radius: number;
      })
    | (BaseShape & {
          type: "pencil";
          points: { x: number; y: number }[];
      })
    | (BaseShape & {
          type: "text";
          x: number;
          y: number;
          content: string;
      })
    | (BaseShape & {
          type: "line";
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      })
    | (BaseShape & {
          type: "rhombus";
          x: number;
          y: number;
          width: number;
          height: number;
      })
    | (BaseShape & {
          type: "arrow";
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      })
    | null;

// small UUID generator for temporary local ids
function makeId() {
    return "id_" + Math.random().toString(36).slice(2, 11);
}

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
    private pathErase: [number, number][]; // in canvas coordinates
    private lastMousePosition: { x: number; y: number };
    private canvasOffset: { x: number; y: number };

    socket: WebSocket;

    private tempLine:
        | { x1: number; y1: number; x2: number; y2: number }
        | null = null;
    private tempRhombus:
        | { x: number; width: number; height: number }
        | null = null;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.fillStyle = this.theme.toString();
        this.canvas.width = typeof window !== 'undefined' ? window.innerWidth : 800;
        this.canvas.height = typeof window !== 'undefined' ? window.innerHeight : 600;
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
        // deep-ish copy for undo/redo safety
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        this.redoStack.length = 0; // Clear redo stack on new action
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
            this.existingShapes = this.undoStack.pop()!;
            this.clearCanvas();
            // notify server? up to you. Usually undo is local-only.
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
            this.existingShapes = this.redoStack.pop()!;
            this.clearCanvas();
        }
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.zoomHandler);
    }

    public deleteShapeById(shapeId: string) {
        const shapeToDelete = this.existingShapes.find(s => s && s.id === shapeId);
        if (!shapeToDelete) {
            console.warn(`Shape with ID ${shapeId} not found`);
            return;
        }

        this.saveState();
        
        this.existingShapes = this.existingShapes.filter(s => s && s.id !== shapeId);

        
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                action: "delete",
                shapeId: shapeToDelete.id,
                shape: shapeToDelete,
            }),
            roomId: this.roomId,
        }));

        this.clearCanvas();
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
        this.existingShapes = await getExistingShapes(this.roomId) || [];
        this.clearCanvas();
    }

    inc() {
        this.scale += 0.2;
        this.clearCanvas();
    }

    dec() {
        this.scale = Math.max(0.1, this.scale - 0.2);
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
            try {
                const message = JSON.parse(event.data);

                if (message.type === "chat") {
                    try {
                        const payload = JSON.parse(message.message);

                        if (payload.action === "create" && payload.shape) {
                           
                            if (payload.shape.id) {
                                
                                const idx = this.existingShapes.findIndex(s => s && s.id === payload.shape.id);
                                if (idx >= 0) {
                                    this.existingShapes[idx] = payload.shape;
                                } else {
                                    this.existingShapes.push(payload.shape);
                                }
                            } else {
                                this.existingShapes.push(payload.shape);
                            }
                        } else if (payload.action === "delete") {
                            if (payload.shapeId) {
                                this.existingShapes = this.existingShapes.filter(s => s && s.id !== payload.shapeId);
                            } else if (payload.shape) {
                                
                                this.existingShapes = this.existingShapes.filter(s => !this._shapesEqualMinimal(s, payload.shape));
                            }
                        } else if (payload.action === "clear") {
                            this.existingShapes = [];
                        }
                        this.clearCanvas();
                    } catch (err) {
                        console.warn("malformed socket chat payload", err);
                    }
                }
            } catch (err) {
                console.warn("Failed to parse WebSocket message", err);
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error in Game class:", error);
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket connection closed in Game class:", event.code, event.reason);
        };
    }

   
    private _shapesEqualMinimal(a: Shape | null, b: any) {
        if (!a || !b) return false;
        if (a.type !== b.type) return false;
        switch (a.type) {
            case "rect":
                return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
            case "circle":
                return a.centerX === b.centerX && a.centerY === b.centerY && a.radius === b.radius;
            case "line":
            case "arrow":
                return a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2;
            case "pencil":
                return JSON.stringify(a.points) === JSON.stringify(b.points);
            case "rhombus":
                return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
            case "text":
                return a.x === b.x && a.y === b.y && a.content === b.content;
        }
        return false;
    }

    private drawShape(shape: Shape) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
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
            case "text":
                this.drawText(shape);
                break;
            case "line":
                this.drawLine(shape);
                break;
            case "rhombus":
                this.drawRhombus(shape);
                break;
            case "arrow":
                this.drawArrow(shape);
                break;
        }
    }

    private drawRect(shape: Extract<Shape, { type: "rect" }>) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    private drawRhombus(shape: Extract<Shape, { type: "rhombus" }>) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.beginPath();
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        this.ctx.moveTo(centerX, shape.y); // top
        this.ctx.lineTo(shape.x + shape.width, centerY); // right
        this.ctx.lineTo(centerX, shape.y + shape.height); // bottom
        this.ctx.lineTo(shape.x, centerY); // left
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawLine(shape: Extract<Shape, { type: "line" }>) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x1, shape.y1);
        this.ctx.lineTo(shape.x2, shape.y2);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawArrow(shape: Extract<Shape, { type: "arrow" }>) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.fillStyle = this.selectedColor.toString();
        
        const headLength = 15;
        const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
        
        // Draw the main line
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x1, shape.y1);
        this.ctx.lineTo(shape.x2, shape.y2);
        this.ctx.stroke();
        
        // Draw the arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x2, shape.y2);
        this.ctx.lineTo(
            shape.x2 - headLength * Math.cos(angle - Math.PI / 6),
            shape.y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(shape.x2, shape.y2);
        this.ctx.lineTo(
            shape.x2 - headLength * Math.cos(angle + Math.PI / 6),
            shape.y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawText(shape: Extract<Shape, { type: "text" }>) {
        if (!shape) return;
        this.ctx.font = "16px Arial, sans-serif";
        
        // Use a contrasting color for better visibility
        const textColor = this.theme === "rgb(24, 24, 27)" ? "#ffffff" : "#000000";
        this.ctx.fillStyle = textColor;
        
        // Add text shadow for better visibility
        this.ctx.shadowColor = this.theme === "rgb(24, 24, 27)" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillText(shape.content, shape.x, shape.y);
        
        // Reset shadow
        this.ctx.shadowColor = "transparent";
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    private drawCircle(shape: Extract<Shape, { type: "circle" }>) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.beginPath();
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawPencil(shape: Extract<Shape, { type: "pencil" }>) {
        if (!shape || !shape.points || shape.points.length === 0) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        const points = shape.points;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach((point) => this.ctx.lineTo(point.x, point.y));
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearCanvas() {
        this.ctx.save();
        // apply transform according to pan/scale
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);

        // clear logical canvas area
        this.ctx.clearRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);
        // fill background according to theme
        this.ctx.fillStyle = this.theme.toString();
        this.ctx.fillRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);

        // draw all shapes in canvas coordinate space
        // NOTE: draw functions expect canvas coords
        for (const shape of this.existingShapes) {
            if (!shape) continue;
            this.drawShape(shape);
        }

        this.ctx.restore();
    }

    // convert client (mouse) coords -> canvas logical coords
    private toCanvasCoords(clientX: number, clientY: number) {
        const x = (clientX - this.canvas.offsetLeft - this.panX) / this.scale;
        const y = (clientY - this.canvas.offsetTop - this.panY) / this.scale;
        return { x, y };
    }

    mouseDownHandler = (e: MouseEvent) => {
        if (this.selectedTool === "text") {
            const pos = this.toCanvasCoords(e.clientX, e.clientY);

            const input = document.createElement("input");
            input.type = "text";
            input.style.position = "fixed";
            input.style.left = `${e.clientX}px`;
            input.style.top = `${e.clientY}px`;
            input.style.fontSize = "16px";
            input.style.fontFamily = "Arial, sans-serif";
            input.style.border = "2px solid #007bff";
            input.style.borderRadius = "4px";
            input.style.outline = "none";
            input.style.background = "white";
            input.style.color = "#000000";
            input.style.zIndex = "9999";
            input.style.minWidth = "150px";
            input.style.padding = "8px 12px";
            input.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
            input.placeholder = "Type text here...";

            document.body.appendChild(input);
            input.focus();

            // Only handle blur when user explicitly finishes (Enter or clicks away)
            let isExplicitlyFinished = false;
            
            input.addEventListener("blur", () => {
                // Only process blur if it was explicitly triggered
                if (isExplicitlyFinished) {
                    const content = input.value;
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }

                    if (content.trim() !== "") {
                        const shape: Shape = { id: makeId(), type: "text", x: pos.x, y: pos.y, content };
                        this.saveState();
                        this.existingShapes.push(shape);

                        // send to server as create
                        this.socket.send(JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({ action: "create", shape }),
                            roomId: this.roomId,
                        }));
                        this.clearCanvas();
                    }
                } else {
                    // If blur was not explicit, refocus the input
                    setTimeout(() => {
                        if (document.body.contains(input)) {
                            input.focus();
                        }
                    }, 10);
                }
            });

            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    isExplicitlyFinished = true;
                    input.blur();
                } else if (event.key === "Escape") {
                    isExplicitlyFinished = true;
                    input.value = "";
                    input.blur();
                }
            });
            
            // Prevent clicks on the input from bubbling up to the canvas
            input.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            
            // Prevent mousedown on the input from bubbling up to the canvas
            input.addEventListener("mousedown", (event) => {
                event.stopPropagation();
            });
            
            // Add a click handler to finish text input when clicking outside
            const finishTextInput = () => {
                isExplicitlyFinished = true;
                input.blur();
            };
            
            // Add a temporary click listener to the document to finish text input
            const documentClickHandler = (e: MouseEvent) => {
                if (!input.contains(e.target as Node)) {
                    finishTextInput();
                    document.removeEventListener('click', documentClickHandler);
                }
            };
            
            // Add the document click handler after a small delay to prevent immediate triggering
            setTimeout(() => {
                document.addEventListener('click', documentClickHandler);
            }, 100);
            
            return;
        }

        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        if (this.selectedTool === "pencil") {
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            // create pencil shape in canvas coords
            const pencilShape: Shape = { id: makeId(), type: "pencil", points: [{ x: p.x, y: p.y }] };
            this.saveState();
            this.existingShapes.push(pencilShape);
        } else if (this.selectedTool === "erase") {
            // reset pathErase with canvas coords
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            this.pathErase = [[p.x, p.y]];
        } else if (this.selectedTool === "hand") {
            this.isDragging = true;
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        } else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            // create a temporary line start point, actual coordinates saved on mouseUp
            this.tempLine = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY };
        } else if (this.selectedTool === "rect" || this.selectedTool === "circle" || this.selectedTool === "rhombus") {
            // We keep startX/startY for drawing preview
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;

        const endCanvas = this.toCanvasCoords(e.clientX, e.clientY);
        const startCanvas = this.toCanvasCoords(this.startX, this.startY);

        let shape: Shape | null = null;

        if (this.selectedTool === "hand") {
            this.isDragging = false;
            return;
        } else if (this.selectedTool === "rect") {
            this.saveState();
            shape = {
                id: makeId(),
                type: "rect",
                x: Math.min(startCanvas.x, endCanvas.x),
                y: Math.min(startCanvas.y, endCanvas.y),
                width: Math.abs(endCanvas.x - startCanvas.x),
                height: Math.abs(endCanvas.y - startCanvas.y),
            };
        } else if (this.selectedTool === "circle") {
            this.saveState();
            const width = Math.abs(endCanvas.x - startCanvas.x);
            const height = Math.abs(endCanvas.y - startCanvas.y);
            const radius = Math.max(width, height) / 2;
            shape = {
                id: makeId(),
                type: "circle",
                radius,
                centerX: Math.min(startCanvas.x, endCanvas.x) + radius,
                centerY: Math.min(startCanvas.y, endCanvas.y) + radius,
            };
        } else if (this.selectedTool === "pencil") {
            // last shape in existingShapes should be the pencil; we already pushed points on move
            const currentShape = this.existingShapes[this.existingShapes.length - 1];
            if (currentShape && currentShape.type === "pencil") {
                // notify server with final pencil shape
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ action: "create", shape: currentShape }),
                    roomId: this.roomId,
                }));
            }
            return;
        } else if (this.selectedTool === "clear") {
            this.saveState();
            
            // Collect all message IDs for database deletion
            const messageIdsToDelete: number[] = [];
            for (const shape of this.existingShapes) {
                if (shape && shape.messageId) {
                    messageIdsToDelete.push(shape.messageId);
                }
            }

            // Clear locally
            this.existingShapes = [];
            this.clearCanvas();
            
            // Notify server via WebSocket
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ action: "clear" }),
                roomId: this.roomId,
            }));

            // Database deletion is now handled by WebSocket backend
            // No need to call HTTP delete endpoints
            
            return;
        } else if (this.selectedTool === "line") {
            this.saveState();
            shape = {
                id: makeId(),
                type: "line",
                x1: startCanvas.x,
                y1: startCanvas.y,
                x2: endCanvas.x,
                y2: endCanvas.y,
            };
        } else if (this.selectedTool === "arrow") {
            this.saveState();
            shape = {
                id: makeId(),
                type: "arrow",
                x1: startCanvas.x,
                y1: startCanvas.y,
                x2: endCanvas.x,
                y2: endCanvas.y,
            };
        } else if (this.selectedTool === "rhombus") {
            this.saveState();
            shape = {
                id: makeId(),
                type: "rhombus",
                x: Math.min(startCanvas.x, endCanvas.x),
                y: Math.min(startCanvas.y, endCanvas.y),
                width: Math.abs(endCanvas.x - startCanvas.x),
                height: Math.abs(endCanvas.y - startCanvas.y),
            };
        } else if (this.selectedTool === "erase") {
            // finalise erase: convert recorded pathErase (already in canvas coords) to deletions
            // find shapes that intersect the erase stroke and remove them
            if (this.pathErase.length > 0) {
                this.saveState();
                const threshold = 8 / this.scale; // eraser width in canvas coords (scaled)
                const toDelete: Shape[] = [];
                for (const s of this.existingShapes) {
                    if (!s) continue;
                    if (this.shapeIntersectsPath(s, this.pathErase, threshold)) {
                        toDelete.push(s);
                    }
                }

                // Collect message IDs for database deletion
                const messageIdsToDelete: number[] = [];
                const shapesToDelete: Shape[] = [];

                // Remove found shapes and notify server
                for (const del of toDelete) {
                    if (!del) continue;
                    
                    // remove locally
                    this.existingShapes = this.existingShapes.filter(s => s && s !== del);

                    // Collect message ID for database deletion if available
                    if (del.messageId) {
                        messageIdsToDelete.push(del.messageId);
                    } else {
                        shapesToDelete.push(del);
                    }

                    // send delete event to server; prefer id if available
                    this.socket.send(JSON.stringify({
                        type: "chat",
                        message: JSON.stringify({
                            action: "delete",
                            shapeId: del.id,
                            // fallback: send shape body so server can try matching
                            shape: del,
                        }),
                        roomId: this.roomId,
                    }));
                }

                // Database deletion is now handled by WebSocket backend
                // No need to call HTTP delete endpoints

                this.pathErase = [];
                this.clearCanvas();
            }
            return;
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);
        // notify server: create
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ action: "create", shape }),
            roomId: this.roomId,
        }));
        this.clearCanvas();
    };

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked && this.selectedTool === "hand" && this.isDragging) {
            const dx = e.clientX - this.lastMousePosition.x;
            const dy = e.clientY - this.lastMousePosition.y;

            // Adjust pan, then redraw
            this.panX += dx;
            this.panY += dy;

            this.clearCanvas();

            this.lastMousePosition = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!this.clicked) return;

        if (this.selectedTool === "pencil") {
            const currentShape = this.existingShapes[this.existingShapes.length - 1];
            if (currentShape && currentShape.type === "pencil") {
                const p = this.toCanvasCoords(e.clientX, e.clientY);
                currentShape.points.push({ x: p.x, y: p.y });
                this.clearCanvas();
                this.drawPencil(currentShape);
            }
            return;
        }

        if (this.selectedTool === "erase") {
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            this.pathErase.push([p.x, p.y]);
            // Draw eraser stroke preview (optional)
            this.clearCanvas();
            // draw eraser polyline for visual feedback
            if (this.pathErase.length > 1) {
                this.ctx.save();
                this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
                this.ctx.beginPath();
                this.ctx.lineWidth = 10 / this.scale;
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.moveTo(this.pathErase[0][0], this.pathErase[0][1]);
                for (let i = 1; i < this.pathErase.length; i++) {
                    this.ctx.lineTo(this.pathErase[i][0], this.pathErase[i][1]);
                }
                this.ctx.stroke();
                this.ctx.restore();
            }
            return;
        }

        // For shape preview: rect/circle/line/rhombus
        const currCanvas = this.toCanvasCoords(e.clientX, e.clientY);
        const startCanvas = this.toCanvasCoords(this.startX, this.startY);

        this.clearCanvas();

        if (this.selectedTool === "rect") {
            this.drawRect({
                id: undefined,
                type: "rect",
                x: Math.min(startCanvas.x, currCanvas.x),
                y: Math.min(startCanvas.y, currCanvas.y),
                width: Math.abs(currCanvas.x - startCanvas.x),
                height: Math.abs(currCanvas.y - startCanvas.y),
            });
        } else if (this.selectedTool === "circle") {
            const width = Math.abs(currCanvas.x - startCanvas.x);
            const height = Math.abs(currCanvas.y - startCanvas.y);
            const radius = Math.max(width, height) / 2;
            this.drawCircle({
                id: undefined,
                type: "circle",
                centerX: Math.min(startCanvas.x, currCanvas.x) + radius,
                centerY: Math.min(startCanvas.y, currCanvas.y) + radius,
                radius,
            });
        } else if (this.selectedTool === "line") {
            this.drawLine({
                id: undefined,
                type: "line",
                x1: startCanvas.x,
                y1: startCanvas.y,
                x2: currCanvas.x,
                y2: currCanvas.y,
            });
        } else if (this.selectedTool === "arrow") {
            this.drawArrow({
                id: undefined,
                type: "arrow",
                x1: startCanvas.x,
                y1: startCanvas.y,
                x2: currCanvas.x,
                y2: currCanvas.y,
            });
        } else if (this.selectedTool === "rhombus") {
            this.drawRhombus({
                id: undefined,
                type: "rhombus",
                x: Math.min(startCanvas.x, currCanvas.x),
                y: Math.min(startCanvas.y, currCanvas.y),
                width: Math.abs(currCanvas.x - startCanvas.x),
                height: Math.abs(currCanvas.y - startCanvas.y),
            });
        } else if (this.selectedTool === "select" && this.shapeSelect) {
            // minimal select movement implementation (if shapeSelect is present)
            if (this.shapeSelect.type === "rect") {
                const dx = currCanvas.x - startCanvas.x;
                const dy = currCanvas.y - startCanvas.y;
                this.shapeSelect.x += dx;
                this.shapeSelect.y += dy;
                // set new start so further moves are relative
                this.startX = e.clientX;
                this.startY = e.clientY;
            } else if (this.shapeSelect.type === "circle") {
                const p = currCanvas;
                this.shapeSelect.centerX = p.x;
                this.shapeSelect.centerY = p.y;
                this.startX = e.clientX;
                this.startY = e.clientY;
            }
        }
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("wheel", this.zoomHandler);
    }

    // ---- Eraser/shapes intersection logic ----
    private shapeIntersectsPath(shape: Shape, path: [number, number][], threshold: number) {
        if (!shape || path.length === 0) return false;

        // bounding box helper
        const bbox = this.shapeBoundingBox(shape);

        // fast bounding box vs path point check
        for (const [px, py] of path) {
            if (px >= bbox.x - threshold && px <= bbox.x + bbox.width + threshold &&
                py >= bbox.y - threshold && py <= bbox.y + bbox.height + threshold) {
                // closer test: distance from point to shape (for lines/circles do exact)
                if (shape.type === "circle") {
                    const dx = px - shape.centerX;
                    const dy = py - shape.centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(dist - shape.radius) <= threshold + 2) return true;
                    // also within radius => erase interior strokes
                    if (dist <= shape.radius + threshold) return true;
                } else if (shape.type === "line" || shape.type === "arrow") {
                    // distance from point to line segment
                    const d = this._pointToSegmentDistance(px, py, shape.x1, shape.y1, shape.x2, shape.y2);
                    if (d <= threshold) return true;
                } else {
                    // for rect/rhombus/pencil/text fallback to bbox proximity
                    return true;
                }
            }
        }

        // Also check path segments vs shape bounds (for long eraser strokes)
        // For lines, check segment intersection
        if (shape.type === "line") {
            for (let i = 1; i < path.length; i++) {
                const [x1, y1] = path[i - 1];
                const [x2, y2] = path[i];
                if (this._segmentsIntersect(x1, y1, x2, y2, shape.x1, shape.y1, shape.x2, shape.y2)) {
                    return true;
                }
                // check distance between segments
                const d = this._segmentToSegmentMinDistance(x1, y1, x2, y2, shape.x1, shape.y1, shape.x2, shape.y2);
                if (d <= threshold) return true;
            }
        }

        // pencil: check if any pencil segment is near any erase segment
        if (shape.type === "pencil") {
            for (let i = 1; i < shape.points.length; i++) {
                const ax = shape.points[i - 1].x, ay = shape.points[i - 1].y;
                const bx = shape.points[i].x, by = shape.points[i].y;
                for (let j = 1; j < path.length; j++) {
                    const px1 = path[j - 1][0], py1 = path[j - 1][1];
                    const px2 = path[j][0], py2 = path[j][1];
                    const d = this._segmentToSegmentMinDistance(ax, ay, bx, by, px1, py1, px2, py2);
                    if (d <= threshold) return true;
                }
            }
        }

        return false;
    }

    private shapeBoundingBox(shape: Shape) {
        switch (shape?.type) {
            case "rect":
                return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
            case "circle":
                return { x: shape.centerX - shape.radius, y: shape.centerY - shape.radius, width: shape.radius * 2, height: shape.radius * 2 };
            case "line":
            case "arrow":
                return { x: Math.min(shape.x1, shape.x2), y: Math.min(shape.y1, shape.y2), width: Math.abs(shape.x2 - shape.x1), height: Math.abs(shape.y2 - shape.y1) };
            case "rhombus":
                return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
            case "pencil":
                if (shape.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
                let minx = shape.points[0].x, maxx = shape.points[0].x, miny = shape.points[0].y, maxy = shape.points[0].y;
                for (const p of shape.points) {
                    if (p.x < minx) minx = p.x;
                    if (p.x > maxx) maxx = p.x;
                    if (p.y < miny) miny = p.y;
                    if (p.y > maxy) maxy = p.y;
                }
                return { x: minx, y: miny, width: maxx - minx, height: maxy - miny };
            case "text":
                // approximate small bbox for text
                return { x: shape.x - 2, y: shape.y - 12, width: shape.content.length * 7 + 4, height: 16 };
            default:
                return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    // distance from point to segment
    private _pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // segment intersection (standard)
    private _segmentsIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
        function ccw(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
            return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
        }
        return (ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4)) && (ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4));
    }

    // approximate min distance between two segments by sampling endpoints and using point-to-segment
    private _segmentToSegmentMinDistance(ax1: number, ay1: number, ax2: number, ay2: number, bx1: number, by1: number, bx2: number, by2: number) {
        const d1 = this._pointToSegmentDistance(ax1, ay1, bx1, by1, bx2, by2);
        const d2 = this._pointToSegmentDistance(ax2, ay2, bx1, by1, bx2, by2);
        const d3 = this._pointToSegmentDistance(bx1, by1, ax1, ay1, ax2, ay2);
        const d4 = this._pointToSegmentDistance(bx2, by2, ax1, ay1, ax2, ay2);
        return Math.min(d1, d2, d3, d4);
    }
}