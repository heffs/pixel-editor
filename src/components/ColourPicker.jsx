import { useState, useEffect } from "react";
import "./ColourPicker.css";
// Props:
// currentColour
// onColourChange
const ColourPicker = (props) => {
    const [colour, setColour] = useState(props.currentColour);
    const [colourMode, setColourMode] = useState("rgb");

    // Whenever the parent sends a new currentColour, update local colour too
    useEffect(() => {
        setColour(props.currentColour);
    }, [props.currentColour]);

    // Handle user changes
    const handleChange = (e) => {
        const newColour = e.target.value;
        setColour(newColour);
        props.onColourChange(newColour); // Inform parent too!
    };

    return (
        <div className="colour-picker">
            <div
                className="colour-preview"
                style={{ backgroundColor: colour }}
            ></div>
            <input
                type="color"
                onChange={handleChange}
                value={props.currentColour}
                className="colour-input"
            />
        </div>
    );
};

export default ColourPicker;
