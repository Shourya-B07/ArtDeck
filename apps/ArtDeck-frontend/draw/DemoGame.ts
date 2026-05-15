import { Color, Theme, Tool } from "@/components/Canvas";

type BaseShape = { id?: string };
type Shape =
    | (BaseShape & { type: "rect"; x: number; y: number; width: number; height: number })
    | (BaseShape & { type: "circle"; centerX: number; centerY: number; radius: number })
    | (BaseShape & { type: "pencil"; points: { x: number; y: number }[] })
    | (BaseShape & { type: "text"; x: number; y: number; content: string })
    | (BaseShape & { type: "line"; x1: number; y1: number; x2: number; y2: number })
    | (BaseShape & { type: "rhombus"; x: number; y: number; width: number; height: number })
    | (BaseShape & { type: "arrow"; x1: number; y1: number; x2: number; y2: number })
    | null;

function makeId() {
    return "id_" + Math.random().toString(36).slice(2, 11);
}

export class DemoGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
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
    private pathErase: [number, number][];
    private lastMousePosition: { x: number; y: number };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.clicked = false;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.selectedColor.toString();
        this.ctx.fillStyle = this.theme.toString();
        this.canvas.width = typeof window !== "undefined" ? window.innerWidth : 800;
        this.canvas.height = typeof window !== "undefined" ? window.innerHeight : 600;
        this.undoStack = [];
        this.redoStack = [];
        this.shapeSelect = null;
        this.pathErase = [];
        this.isDragging = false;
        this.lastMousePosition = { x: 0, y: 0 };
        this.clearCanvas();
        this.initMouseHandlers();
    }

    private saveState() {
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        this.redoStack.length = 0;
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
            this.existingShapes = this.undoStack.pop()!;
            this.clearCanvas();
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

    setTool(tool: Tool) { this.selectedTool = tool; }

    setColor(color: Color) {
        this.selectedColor = color;
        if (this.ctx) this.ctx.strokeStyle = color;
    }

    setTheme(theme: Theme) {
        this.theme = theme;
        if (this.ctx) {
            this.ctx.fillStyle = theme === "rgb(24, 24, 27)" ? "rgb(24,24,27)" : "rgb(255,255,255)";
            this.ctx.strokeStyle = theme === "rgb(255, 255, 255)" ? "#000000" : "#ffffff";
        }
    }

    inc() { this.scale += 0.2; this.clearCanvas(); }
    dec() { this.scale = Math.max(0.1, this.scale - 0.2); this.clearCanvas(); }

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

    // ---- Drawing helpers ----
    private drawShape(shape: Shape) {
        if (!shape) return;
        this.ctx.strokeStyle = this.selectedColor.toString();
        switch (shape.type) {
            case "rect": this.drawRect(shape); break;
            case "circle": this.drawCircle(shape); break;
            case "pencil": this.drawPencil(shape); break;
            case "text": this.drawText(shape); break;
            case "line": this.drawLine(shape); break;
            case "rhombus": this.drawRhombus(shape); break;
            case "arrow": this.drawArrow(shape); break;
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
        const cx = shape.x + shape.width / 2, cy = shape.y + shape.height / 2;
        this.ctx.moveTo(cx, shape.y);
        this.ctx.lineTo(shape.x + shape.width, cy);
        this.ctx.lineTo(cx, shape.y + shape.height);
        this.ctx.lineTo(shape.x, cy);
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
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x1, shape.y1);
        this.ctx.lineTo(shape.x2, shape.y2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x2, shape.y2);
        this.ctx.lineTo(shape.x2 - headLength * Math.cos(angle - Math.PI / 6), shape.y2 - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(shape.x2, shape.y2);
        this.ctx.lineTo(shape.x2 - headLength * Math.cos(angle + Math.PI / 6), shape.y2 - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawText(shape: Extract<Shape, { type: "text" }>) {
        if (!shape) return;
        this.ctx.font = "16px Arial, sans-serif";
        const textColor = this.theme === "rgb(24, 24, 27)" ? "#ffffff" : "#000000";
        this.ctx.fillStyle = textColor;
        this.ctx.shadowColor = this.theme === "rgb(24, 24, 27)" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.fillText(shape.content, shape.x, shape.y);
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
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((p) => this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
        this.ctx.clearRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);
        this.ctx.fillStyle = this.theme.toString();
        this.ctx.fillRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);
        for (const shape of this.existingShapes) {
            if (!shape) continue;
            this.drawShape(shape);
        }
        this.ctx.restore();
    }

    private toCanvasCoords(clientX: number, clientY: number) {
        return {
            x: (clientX - this.canvas.offsetLeft - this.panX) / this.scale,
            y: (clientY - this.canvas.offsetTop - this.panY) / this.scale,
        };
    }

    // ---- Mouse handlers (no socket calls) ----
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

            let isExplicitlyFinished = false;
            input.addEventListener("blur", () => {
                if (isExplicitlyFinished) {
                    const content = input.value;
                    if (document.body.contains(input)) document.body.removeChild(input);
                    if (content.trim() !== "") {
                        const shape: Shape = { id: makeId(), type: "text", x: pos.x, y: pos.y, content };
                        this.saveState();
                        this.existingShapes.push(shape);
                        this.clearCanvas();
                    }
                } else {
                    setTimeout(() => { if (document.body.contains(input)) input.focus(); }, 10);
                }
            });
            input.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") { isExplicitlyFinished = true; input.blur(); }
                else if (ev.key === "Escape") { isExplicitlyFinished = true; input.value = ""; input.blur(); }
            });
            input.addEventListener("click", (ev) => ev.stopPropagation());
            input.addEventListener("mousedown", (ev) => ev.stopPropagation());
            const documentClickHandler = (ev: MouseEvent) => {
                if (!input.contains(ev.target as Node)) { isExplicitlyFinished = true; input.blur(); document.removeEventListener("click", documentClickHandler); }
            };
            setTimeout(() => document.addEventListener("click", documentClickHandler), 100);
            return;
        }

        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        if (this.selectedTool === "pencil") {
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            this.saveState();
            this.existingShapes.push({ id: makeId(), type: "pencil", points: [{ x: p.x, y: p.y }] });
        } else if (this.selectedTool === "erase") {
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            this.pathErase = [[p.x, p.y]];
        } else if (this.selectedTool === "hand") {
            this.isDragging = true;
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        const endCanvas = this.toCanvasCoords(e.clientX, e.clientY);
        const startCanvas = this.toCanvasCoords(this.startX, this.startY);
        let shape: Shape | null = null;

        if (this.selectedTool === "hand") { this.isDragging = false; return; }

        if (this.selectedTool === "rect") {
            this.saveState();
            shape = { id: makeId(), type: "rect", x: Math.min(startCanvas.x, endCanvas.x), y: Math.min(startCanvas.y, endCanvas.y), width: Math.abs(endCanvas.x - startCanvas.x), height: Math.abs(endCanvas.y - startCanvas.y) };
        } else if (this.selectedTool === "circle") {
            this.saveState();
            const w = Math.abs(endCanvas.x - startCanvas.x), h = Math.abs(endCanvas.y - startCanvas.y);
            const r = Math.max(w, h) / 2;
            shape = { id: makeId(), type: "circle", radius: r, centerX: Math.min(startCanvas.x, endCanvas.x) + r, centerY: Math.min(startCanvas.y, endCanvas.y) + r };
        } else if (this.selectedTool === "pencil") {
            return; // already pushed during mouseDown/Move
        } else if (this.selectedTool === "clear") {
            this.saveState();
            this.existingShapes = [];
            this.clearCanvas();
            return;
        } else if (this.selectedTool === "line") {
            this.saveState();
            shape = { id: makeId(), type: "line", x1: startCanvas.x, y1: startCanvas.y, x2: endCanvas.x, y2: endCanvas.y };
        } else if (this.selectedTool === "arrow") {
            this.saveState();
            shape = { id: makeId(), type: "arrow", x1: startCanvas.x, y1: startCanvas.y, x2: endCanvas.x, y2: endCanvas.y };
        } else if (this.selectedTool === "rhombus") {
            this.saveState();
            shape = { id: makeId(), type: "rhombus", x: Math.min(startCanvas.x, endCanvas.x), y: Math.min(startCanvas.y, endCanvas.y), width: Math.abs(endCanvas.x - startCanvas.x), height: Math.abs(endCanvas.y - startCanvas.y) };
        } else if (this.selectedTool === "erase") {
            if (this.pathErase.length > 0) {
                this.saveState();
                const threshold = 8 / this.scale;
                const toDelete: Shape[] = [];
                for (const s of this.existingShapes) {
                    if (!s) continue;
                    if (this.shapeIntersectsPath(s, this.pathErase, threshold)) toDelete.push(s);
                }
                for (const del of toDelete) {
                    this.existingShapes = this.existingShapes.filter(s => s && s !== del);
                }
                this.pathErase = [];
                this.clearCanvas();
            }
            return;
        }

        if (!shape) return;
        this.existingShapes.push(shape);
        this.clearCanvas();
    };

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked && this.selectedTool === "hand" && this.isDragging) {
            this.panX += e.clientX - this.lastMousePosition.x;
            this.panY += e.clientY - this.lastMousePosition.y;
            this.clearCanvas();
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
            return;
        }
        if (!this.clicked) return;

        if (this.selectedTool === "pencil") {
            const cur = this.existingShapes[this.existingShapes.length - 1];
            if (cur && cur.type === "pencil") {
                const p = this.toCanvasCoords(e.clientX, e.clientY);
                cur.points.push({ x: p.x, y: p.y });
                this.clearCanvas();
                this.drawPencil(cur);
            }
            return;
        }

        if (this.selectedTool === "erase") {
            const p = this.toCanvasCoords(e.clientX, e.clientY);
            this.pathErase.push([p.x, p.y]);
            this.clearCanvas();
            if (this.pathErase.length > 1) {
                this.ctx.save();
                this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
                this.ctx.beginPath();
                this.ctx.lineWidth = 10 / this.scale;
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.moveTo(this.pathErase[0][0], this.pathErase[0][1]);
                for (let i = 1; i < this.pathErase.length; i++) this.ctx.lineTo(this.pathErase[i][0], this.pathErase[i][1]);
                this.ctx.stroke();
                this.ctx.restore();
            }
            return;
        }

        const curr = this.toCanvasCoords(e.clientX, e.clientY);
        const start = this.toCanvasCoords(this.startX, this.startY);
        this.clearCanvas();

        if (this.selectedTool === "rect") {
            this.drawRect({ id: undefined, type: "rect", x: Math.min(start.x, curr.x), y: Math.min(start.y, curr.y), width: Math.abs(curr.x - start.x), height: Math.abs(curr.y - start.y) });
        } else if (this.selectedTool === "circle") {
            const w = Math.abs(curr.x - start.x), h = Math.abs(curr.y - start.y), r = Math.max(w, h) / 2;
            this.drawCircle({ id: undefined, type: "circle", centerX: Math.min(start.x, curr.x) + r, centerY: Math.min(start.y, curr.y) + r, radius: r });
        } else if (this.selectedTool === "line") {
            this.drawLine({ id: undefined, type: "line", x1: start.x, y1: start.y, x2: curr.x, y2: curr.y });
        } else if (this.selectedTool === "arrow") {
            this.drawArrow({ id: undefined, type: "arrow", x1: start.x, y1: start.y, x2: curr.x, y2: curr.y });
        } else if (this.selectedTool === "rhombus") {
            this.drawRhombus({ id: undefined, type: "rhombus", x: Math.min(start.x, curr.x), y: Math.min(start.y, curr.y), width: Math.abs(curr.x - start.x), height: Math.abs(curr.y - start.y) });
        }
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("wheel", this.zoomHandler);
    }

    // ---- Eraser intersection logic ----
    private shapeIntersectsPath(shape: Shape, path: [number, number][], threshold: number) {
        if (!shape || path.length === 0) return false;
        const bbox = this.shapeBoundingBox(shape);
        for (const [px, py] of path) {
            if (px >= bbox.x - threshold && px <= bbox.x + bbox.width + threshold && py >= bbox.y - threshold && py <= bbox.y + bbox.height + threshold) {
                if (shape.type === "circle") {
                    const dx = px - shape.centerX, dy = py - shape.centerY, dist = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(dist - shape.radius) <= threshold + 2 || dist <= shape.radius + threshold) return true;
                } else if (shape.type === "line" || shape.type === "arrow") {
                    if (this._ptSegDist(px, py, shape.x1, shape.y1, shape.x2, shape.y2) <= threshold) return true;
                } else {
                    return true;
                }
            }
        }
        if (shape.type === "pencil") {
            for (let i = 1; i < shape.points.length; i++) {
                for (let j = 1; j < path.length; j++) {
                    if (this._segSegDist(shape.points[i-1].x, shape.points[i-1].y, shape.points[i].x, shape.points[i].y, path[j-1][0], path[j-1][1], path[j][0], path[j][1]) <= threshold) return true;
                }
            }
        }
        return false;
    }

    private shapeBoundingBox(shape: Shape) {
        switch (shape?.type) {
            case "rect": case "rhombus": return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
            case "circle": return { x: shape.centerX - shape.radius, y: shape.centerY - shape.radius, width: shape.radius * 2, height: shape.radius * 2 };
            case "line": case "arrow": return { x: Math.min(shape.x1, shape.x2), y: Math.min(shape.y1, shape.y2), width: Math.abs(shape.x2 - shape.x1), height: Math.abs(shape.y2 - shape.y1) };
            case "pencil": {
                if (shape.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
                let mnx = shape.points[0].x, mxx = mnx, mny = shape.points[0].y, mxy = mny;
                for (const p of shape.points) { if (p.x < mnx) mnx = p.x; if (p.x > mxx) mxx = p.x; if (p.y < mny) mny = p.y; if (p.y > mxy) mxy = p.y; }
                return { x: mnx, y: mny, width: mxx - mnx, height: mxy - mny };
            }
            case "text": return { x: shape.x - 2, y: shape.y - 12, width: shape.content.length * 7 + 4, height: 16 };
            default: return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    private _ptSegDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
        const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
        const dot = A * C + B * D, len2 = C * C + D * D;
        let t = len2 !== 0 ? dot / len2 : -1;
        t = Math.max(0, Math.min(1, t));
        const dx = px - (x1 + t * C), dy = py - (y1 + t * D);
        return Math.sqrt(dx * dx + dy * dy);
    }

    private _segSegDist(ax1: number, ay1: number, ax2: number, ay2: number, bx1: number, by1: number, bx2: number, by2: number) {
        return Math.min(this._ptSegDist(ax1, ay1, bx1, by1, bx2, by2), this._ptSegDist(ax2, ay2, bx1, by1, bx2, by2), this._ptSegDist(bx1, by1, ax1, ay1, ax2, ay2), this._ptSegDist(bx2, by2, ax1, ay1, ax2, ay2));
    }
}
