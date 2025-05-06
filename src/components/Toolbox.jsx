import "./Toolbox.css";
import 'boxicons'

// Props:
// currentTool
// onToolChange
const Toolbox = (props) => {
    const tools = [
        { id: "pencil", name: "Pencil", icon: "pencil" },
        { id: "eraser", name: "Eraser", icon: "eraser" },
    ];

    return (
        <div className="toolbox">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    className={`tool-button ${
                        props.currentTool === tool.id ? "active" : ""
                    }`}
                    onClick={() => props.onToolChange(tool.id)}
                    title={tool.name}
                >
                    <box-icon name={tool.icon} color="#fff"></box-icon>
                </button>
            ))}
        </div>
    );
};

export default Toolbox;