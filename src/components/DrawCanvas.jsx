import { useEffect, useRef, useState } from "react";
import { CRTShader } from "../utils/CRTShader";
import "./DrawCanvas.css";
import { rgbaToUint32, hexToUint32 } from "../utils/colorMath";
// Props:
// currentTool
// currentColor
// pixelartWidth
// pixelartHeight
// crtScale
// canvasZoom
// crtEnabled
// gridEnabled
// currentShader

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const DrawCanvas = (props) => {
    const canvasRef = useRef(null);
    const crtCanvasRef = useRef(null);
    const interfaceCanvasRef = useRef(null);

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    const baseCanvasWidth = props.pixelartWidth * 4;
    const baseCanvasHeight = props.pixelartHeight * 4;
    const crtCanvasWidth = props.pixelartWidth * props.crtScale; // Variable for CRT canvas
    const crtCanvasHeight = props.pixelartHeight * props.crtScale; // Determines CRT resolution
    const interfaceCanvasWidth = props.pixelartWidth * 16;
    const interfaceCanvasHeight = props.pixelartHeight * 16;
    let containerWidth = baseCanvasWidth * 4 * 16;
    let containerHeight = baseCanvasHeight * 4 * 16;

    const [pixelartData, setPixelartData] = useState([]);
    const [crtShader, setCrtShader] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [canvasTranslate, setCanvasTranslate] = useState({
        x: (windowWidth - containerWidth) / 2,
        y: (windowHeight - containerHeight) / 2,
    });
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

    const debouncedRender = useRef(
        debounce(() => {
            render();
        }, 33)
    ).current;

    // When pixelartWidth or pixelartHeight changes, i.e. when there is a new canvas, initialise the canvases and data
    useEffect(() => {
        const newPixelartData = new Uint32Array(
            props.pixelartWidth * props.pixelartHeight
        );
        newPixelartData.fill(0xff000000);

        setPixelartData(newPixelartData);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = baseCanvasWidth;
        canvas.height = baseCanvasHeight;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const crtCanvas = crtCanvasRef.current;
        crtCanvas.width = crtCanvasWidth;
        crtCanvas.height = crtCanvasHeight;

        containerWidth = baseCanvasWidth * 4 * 16;
        containerHeight = baseCanvasHeight * 4 * 16;

        setCanvasTranslate({
            x: (window.innerWidth - containerWidth) / 2,
            y: (window.innerHeight - containerHeight) / 2,
        });
    }, [props.pixelartWidth, props.pixelartHeight]);

    // When the current shader name changes, either create the shader if it does not exist, or change the shader if it does
    useEffect(() => {
        if (props.currentShader === null) {
            return;
        }
        if (!crtShader) {
            const shader = new CRTShader(
                crtCanvasRef.current,
                props.currentShader
            );
            setCrtShader(shader);
        } else {
            crtShader.changeShader(props.currentShader);
        }
    }, [props.currentShader]);

    // When crtShader changes, i.e., stops being null, setup the CRT canvas
    useEffect(() => {
        const newPixelartData = new Uint32Array(
            props.pixelartWidth * props.pixelartHeight
        );
        newPixelartData.fill(0xff000000);

        setPixelartData(newPixelartData);

        // Intialise canvases
        // Draw canvas
        const canvas = canvasRef.current;
        // const ctx = canvas.getContext("2d");
        canvas.width = baseCanvasWidth;
        canvas.height = baseCanvasHeight;
        // ctx.fillStyle = "#000";
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [crtShader]);

    // Reset the CRT canvas viewport when the CRT scale changes
    // Effect dependencies: crtScale
    useEffect(() => {
        if (crtCanvasRef.current) {
            render();
        }
    }, [props.crtScale]);

    // Render when pixelartData changes
    // Effect dependencies: pixelartData
    useEffect(() => {
        render();
        // debouncedRender();
    }, [pixelartData, props.currentShader]);

    // Render the interface canvas
    // Effect dependencies: gridEnabled
    useEffect(() => {
        renderInterface();
    }, [props.gridEnabled]);

    const renderInterface = () => {
        const interfaceCanvas = interfaceCanvasRef.current;
        interfaceCanvas.width = props.pixelartWidth * 16;
        interfaceCanvas.height = props.pixelartHeight * 16;
        const ctx = interfaceCanvas.getContext("2d");
        ctx.clearRect(0, 0, interfaceCanvas.width, interfaceCanvas.height);
        // Draw grid if enabled
        if (props.gridEnabled) {
            ctx.strokeStyle = "#ffffff90";
            ctx.lineWidth = 1;
            ctx.setLineDash([1, 2]);

            // Draw vertical lines
            for (let x = 1; x < props.pixelartWidth; x++) {
                ctx.beginPath();
                ctx.moveTo(x * 16, 0);
                ctx.lineTo(x * 16, props.pixelartHeight * 16);
                ctx.stroke();
            }

            // Draw horizontal lines
            for (let y = 1; y < props.pixelartHeight; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * 16);
                ctx.lineTo(props.pixelartWidth * 16, y * 16);
                ctx.stroke();
            }
        }
    };

    const render = () => {
        if (!pixelartData || !crtShader) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const crtCtx = crtCanvasRef.current.getContext("webgl2");

        // Clear canvas
        // ctx.fillStyle = "#000";
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw imagedata to a temporary canvas, pixelartwidth x pixelartheight
        // const imagedata = new ImageData(
        //     new Uint8ClampedArray(pixelartData.buffer),
        //     props.pixelartWidth,
        //     props.pixelartHeight
        // );
        // const tempCanvas = document.createElement("canvas");
        // tempCanvas.width = props.pixelartWidth;
        // tempCanvas.height = props.pixelartHeight;
        // const tempCtx = tempCanvas.getContext("2d");
        // tempCtx.putImageData(imagedata, 0, 0);

        // // Draw scaled up temp canvas to draw canvas
        // ctx.imageSmoothingEnabled = false;
        // ctx.drawImage(
        //     tempCanvas,
        //     0,
        //     0,
        //     props.pixelartWidth * 4,
        //     props.pixelartHeight * 4
        // );

                // Create ImageData directly from pixelartData
        const imagedata = new ImageData(
            new Uint8ClampedArray(pixelartData.buffer),
            props.pixelartWidth,
            props.pixelartHeight
        );

        // Draw directly to the canvas without intermediate steps
        ctx.imageSmoothingEnabled = false;
        ctx.putImageData(
            imagedata,
            0,
            0,
            0,
            0,
            props.pixelartWidth,
            props.pixelartHeight
        );
        ctx.drawImage(
            canvas,
            0,
            0,
            props.pixelartWidth,
            props.pixelartHeight,
            0,
            0,
            props.pixelartWidth * 4,
            props.pixelartHeight * 4
        );

        crtCtx.viewport(0, 0, crtCanvasWidth, crtCanvasHeight);
        crtShader.render(canvas, props.crtScale);
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const getPixelartPos = (canvasPos) => {
        return {
            x: Math.floor(canvasPos.x / 4),
            y: Math.floor(canvasPos.y / 4),
        };
    };

    const setPixelartDataAtPos = (pos, colour) => {
        const index = pos.y * props.pixelartWidth + pos.x;
        const newPixelartData = new Uint32Array(pixelartData.buffer);
        newPixelartData[index] = hexToUint32(colour);
        setPixelartData(newPixelartData);
    };

    const draw = (e) => {
        if (!isDrawing) {
            return;
        }

        const pos = getMousePos(e);
        const pixel = getPixelartPos(pos);

        switch (props.currentTool) {
            case "pencil":
                setPixelartDataAtPos(pixel, props.currentColour);
                break;
            case "eraser":
                drawEraser(e);
                break;
            default:
                break;
        }
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            setIsDrawing(true);
            const canvasPos = getMousePos(e);
            const pixelartPos = getPixelartPos(canvasPos);
            setStartPos(pixelartPos);
        } else if (e.button === 1) {
            setIsDragging(true);
            setDragStartPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            const canvasPos = getMousePos(e);
            const pixelartPos = getPixelartPos(canvasPos);
            setCanvasTranslate({
                x: canvasTranslate.x + (pixelartPos.x - startPos.x),
                y: canvasTranslate.y + (pixelartPos.y - startPos.y),
            });
        } else {
            draw(e);
        }
        setIsDrawing(false);
    };

    const handleMouseMove = (e) => {
        if (isDrawing) {
            draw(e);
        }
    };

    const handleContainerMouseDown = (e) => {
        if (e.button === 1) {
            setIsDragging(true);
            setDragStartPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleContainerMouseMove = (e) => {
        if (isDragging) {
            setCanvasTranslate({
                x: canvasTranslate.x + (e.clientX - dragStartPos.x),
                y: canvasTranslate.y + (e.clientY - dragStartPos.y),
            });
            setDragStartPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleContainerMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="canvas-container"
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                transform: `translate(${canvasTranslate.x}px, ${canvasTranslate.y}px)`,
            }}
        >
            <canvas
                ref={canvasRef}
                className="draw-canvas"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
                style={{
                    width: `${baseCanvasWidth}px`,
                    height: `${baseCanvasHeight}px`,
                    transform: `translate(-50%, -50%) scale(${props.canvasZoom})`,
                }}
            />
            <canvas
                ref={crtCanvasRef}
                className="crt-canvas"
                style={{
                    width: `${crtCanvasWidth}px`,
                    height: `${crtCanvasHeight}px`,
                    transform: `translate(-50%, -50%) scale(${
                        (4 * props.canvasZoom) / props.crtScale
                    })`,
                    pointerEvents: "none",
                    visibility: props.crtEnabled ? "visible" : "hidden",
                }}
            />
            <canvas
                ref={interfaceCanvasRef}
                className="interface-canvas"
                style={{
                    width: `${interfaceCanvasWidth}px`,
                    height: `${interfaceCanvasHeight}px`,
                    transform: `translate(-50%, -50%) scale(${
                        props.canvasZoom / 4
                    })`,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
};

export default DrawCanvas;
