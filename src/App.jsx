import { use, useState, useEffect } from "react";
import "./App.css";
import DrawCanvas from "./components/DrawCanvas.jsx";
import Toolbox from "./components/Toolbox.jsx";
import ColourPicker from "./components/ColourPicker.jsx";
import MenuBar from "./components/MenuBar.jsx";
import NewFileDialog from "./components/NewFileDialog.jsx";
import { SHADERS } from "./assets/shaderSources";

function App() {
    const [currentTool, setCurrentTool] = useState("pencil");
    const [currentColour, setCurrentColour] = useState("#ffffff");

    const [pixelartWidth, setPixelartWidth] = useState(16);
    const [pixelartHeight, setPixelartHeight] = useState(16);
    const [brushSize, setBrushSize] = useState(1);
    const [crtScale, setCrtScale] = useState(4);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [crtEnabled, setCrtEnabled] = useState(true);
    const [gridEnabled, setGridEnabled] = useState(false);
    const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
    const [shaders, setShaders] = useState([]);
    const [currentShader, setCurrentShader] = useState(null);

    useEffect(() => {
        setShaders(SHADERS);
        setCurrentShader(SHADERS[0].name);
    }, []);

    const handleScroll = (e) => {
        const delta = e.deltaY;
        if (delta < 0 && canvasZoom < 16) {
            setCanvasZoom(canvasZoom + 0.25);
        } else if (delta > 0 && canvasZoom > 0.25) {
            setCanvasZoom(canvasZoom - 0.25);
        }
    };

    const handleNew = () => {
        setIsNewFileDialogOpen(true);
    };

    const handleCreateNew = (width, height) => {
        setPixelartWidth(width);
        setPixelartHeight(height);
    };

    const handleOpen = () => {
        console.log("Open file");
        // ToDo
    };

    const handleSave = () => {
        console.log("Save file");
        // ToDo
    };

    const handleSaveAs = () => {
        console.log("Save file as");
    };

    const handleExit = () => {
        console.log("Exit");
    };

    const handleShaderChange = (shader) => {
        console.log("Change shader to", shader);
        setCurrentShader(shader);
    };

    return (
        <div className="app" onWheel={handleScroll}>
            <div className="header-area">
                <MenuBar
                    onNew={handleNew}
                    onOpen={handleOpen}
                    onSave={handleSave}
                    onSaveAs={handleSaveAs}
                    onExit={handleExit}
                    onShaderChange={handleShaderChange}
                    shaders={shaders.map((shader) => shader.name)}
                    currentShader={currentShader}
                />
                <div className="options-bar">
                    <div className="brush-size">
                        <label>Brush size</label>
                        <input
                            type="range"
                            min="1"
                            max="32"
                            value={brushSize}
                            onChange={(e) => setBrushSize(e.target.value)}
                        />
                    </div>
                    <div className="crt-scale">
                        <label>CRT scale</label>
                        <input
                            type="range"
                            min="1"
                            max="16"
                            value={crtScale}
                            onChange={(e) =>
                                setCrtScale(parseFloat(e.target.value))
                            }
                        />
                        <span>{crtScale}x</span>
                    </div>
                    <div className="canvas-zoom">
                        <label>Canvas zoom</label>
                        <input
                            type="range"
                            min="0.25"
                            max="16"
                            step="0.25"
                            value={canvasZoom}
                            onChange={(e) =>
                                setCanvasZoom(parseInt(e.target.value))
                            }
                        />
                        <span>{canvasZoom}x</span>
                    </div>
                    <div className="crt-toggle">
                        <label>Toggle CRT</label>
                        <input
                            type="checkbox"
                            checked={crtEnabled}
                            onChange={(e) => setCrtEnabled(e.target.checked)}
                        />
                    </div>
                    <div className="grid-toggle">
                        <label>Toggle Grid</label>
                        <input
                            type="checkbox"
                            checked={gridEnabled}
                            onChange={(e) => setGridEnabled(e.target.checked)}
                        />
                    </div>
                </div>
            </div>
            <div className="draw-area">
                <Toolbox
                    currentTool={currentTool}
                    onToolChange={setCurrentTool}
                />
                <ColourPicker
                    currentColour={currentColour}
                    onColourChange={setCurrentColour}
                />
                <DrawCanvas
                    currentTool={currentTool}
                    currentColour={currentColour}
                    pixelartWidth={pixelartWidth}
                    pixelartHeight={pixelartHeight}
                    crtScale={crtScale}
                    canvasZoom={canvasZoom}
                    crtEnabled={crtEnabled}
                    gridEnabled={gridEnabled}
                    currentShader={currentShader}
                />
            </div>
            <NewFileDialog
                isOpen={isNewFileDialogOpen}
                onClose={() => setIsNewFileDialogOpen(false)}
                onCreate={handleCreateNew}
            />
        </div>
    );
}

export default App;
