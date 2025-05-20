import { useState, useEffect } from "react";
import { rgbToHsv, hsvToRgb, rgbToHex, hexToRgb } from "../utils/colorMath";
import "./ColourPicker.css";

// Props:
// currentColour
// onColourChange
// onPaletteChange
const ColourPicker = (props) => {
    const [colour, setColour] = useState(props.currentColour);
    const [colourMode, setColourMode] = useState("rgb");
    const [palette, setPalette] = useState([]);
    const [rgbValues, setRgbValues] = useState({ r: 255, g: 255, b: 255 });
    const [hsvValues, setHsvValues] = useState({ h: 0, s: 0, v: 100 });

    // Convert hex to RGB and HSV when component mounts or colour changes
    useEffect(() => {
        const rgb = hexToRgb(colour);
        if (rgb) {
            setRgbValues(rgb);
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsvValues(hsv);
        }
    }, [colour]);

    // When the palette changes, send it to the parent
    useEffect(() => {
        props.onPaletteChange(palette);
    }, [palette]);

    // Whenever the parent sends a new currentColour, update local colour too
    useEffect(() => {
        setColour(props.currentColour);
    }, [props.currentColour]);

    // Handle color mode change
    const handleModeChange = (mode) => {
        setColourMode(mode);
    };

    // Handle RGB value changes
    const handleRgbChange = (channel, value) => {
        const newRgb = { ...rgbValues, [channel]: parseInt(value) };
        setRgbValues(newRgb);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        setColour(newHex);
        props.onColourChange(newHex);
    };

    // Handle HSV value changes
    const handleHsvChange = (channel, value) => {
        const newHsv = { ...hsvValues, [channel]: parseInt(value) };
        setHsvValues(newHsv);
        const rgb = hsvToRgb(newHsv.h / 360, newHsv.s / 100, newHsv.v / 100);
        const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setColour(newHex);
        props.onColourChange(newHex);
    };

    // Handle color bar click
    const handleColorBarClick = (e, channel) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        if (colourMode === "rgb") {
            const value = Math.round(percentage * 255);
            handleRgbChange(channel, value);
        } else if (colourMode === "hsv") {
            if (channel === "h") {
                const value = Math.round(percentage * 360);
                handleHsvChange(channel, value);
            } else {
                const value = Math.round(percentage * 100);
                handleHsvChange(channel, value);
            }
        }
    };

    // Add color to palette
    const addToPalette = () => {
        if (!palette.includes(colour)) {
            setPalette([...palette, colour]);
        }
    };

    // Select color from palette
    const selectFromPalette = (color) => {
        setColour(color);
        props.onColourChange(color);
    };

    return (
        <div className="colour-picker">
            <div
                className="colour-preview"
                style={{ backgroundColor: colour }}
            ></div>

            <div className="colour-mode-selector">
                <button
                    className={colourMode === "rgb" ? "active" : ""}
                    onClick={() => handleModeChange("rgb")}
                >
                    RGB
                </button>
                <button
                    className={colourMode === "hsv" ? "active" : ""}
                    onClick={() => handleModeChange("hsv")}
                >
                    HSV
                </button>
            </div>

            {colourMode === "rgb" && (
                <div className="colour-bars">
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(0, ${rgbValues.g}, ${rgbValues.b}), 
                                    rgb(255, ${rgbValues.g}, ${rgbValues.b})
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "r")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbValues.r}
                            onChange={(e) =>
                                handleRgbChange("r", e.target.value)
                            }
                        />
                    </div>
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(${rgbValues.r}, 0, ${rgbValues.b}), 
                                    rgb(${rgbValues.r}, 255, ${rgbValues.b})
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "g")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbValues.g}
                            onChange={(e) =>
                                handleRgbChange("g", e.target.value)
                            }
                        />
                    </div>
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(${rgbValues.r}, ${rgbValues.g}, 0), 
                                    rgb(${rgbValues.r}, ${rgbValues.g}, 255)
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "b")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbValues.b}
                            onChange={(e) =>
                                handleRgbChange("b", e.target.value)
                            }
                        />
                    </div>
                </div>
            )}

            {colourMode === "hsv" && (
                <div className="colour-bars">
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(255, 0, 0), 
                                    rgb(255, 255, 0), 
                                    rgb(0, 255, 0), 
                                    rgb(0, 255, 255), 
                                    rgb(0, 0, 255), 
                                    rgb(255, 0, 255), 
                                    rgb(255, 0, 0)
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "h")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="360"
                            value={hsvValues.h}
                            onChange={(e) =>
                                handleHsvChange("h", e.target.value)
                            }
                        />
                    </div>
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(${hsvValues.v}%, 0%, 0%), 
                                    rgb(${hsvValues.v}%, ${hsvValues.v}%, 0%)
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "s")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={hsvValues.s}
                            onChange={(e) =>
                                handleHsvChange("s", e.target.value)
                            }
                        />
                    </div>
                    <div className="colour-bar">
                        <div
                            className="bar-gradient"
                            style={{
                                background: `linear-gradient(to right, 
                                    rgb(0, 0, 0), 
                                    rgb(${hsvValues.v}%, ${hsvValues.v}%, ${hsvValues.v}%)
                                )`,
                            }}
                            onClick={(e) => handleColorBarClick(e, "v")}
                        />
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={hsvValues.v}
                            onChange={(e) =>
                                handleHsvChange("v", e.target.value)
                            }
                        />
                    </div>
                </div>
            )}

            <button className="add-to-palette" onClick={addToPalette}>
                Add to Palette
            </button>

            <div className="colour-palette">
                {palette.map((color, index) => (
                    <div
                        key={index}
                        className="palette-color"
                        style={{ backgroundColor: color }}
                        onClick={() => selectFromPalette(color)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColourPicker;
