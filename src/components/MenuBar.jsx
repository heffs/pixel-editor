import { useState } from "react";
import "./MenuBar.css";

// Props:
// title
// children
const MenuItem = (props) => {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="menu-item"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button>{props.title}</button>
            {open && <div className="dropdown">{props.children}</div>}
        </div>
    );
};


// Props:
// onNew, onOpen, onSave, onSaveAs, onExit
const MenuBar = (props) => {
    return (
        <div className="menu-bar">
            <MenuItem title="File">
                <div className="dropdown-content">
                    <button onClick={props.onNew}>New</button>
                    <button onClick={props.onOpen}>Open</button>
                    <button onClick={props.onSave}>Save</button>
                    <button onClick={props.onSaveAs}>Save As</button>
                    <button onClick={props.onExit}>Exit</button>
                </div>
            </MenuItem>
            <MenuItem title="Edit">
                <div className="dropdown-content">
                    <button>Undo</button>
                    <button>Redo</button>
                    <button>Cut</button>
                    <button>Copy</button>
                    <button>Paste</button>
                </div>
            </MenuItem>
            <MenuItem title="View">
                <div className="dropdown-content">
                    <button>Zoom In</button>
                    <button>Zoom Out</button>
                    <button>Reset Zoom</button>
                </div>
            </MenuItem>
            <MenuItem title="Shader">
                <div className="dropdown-content">
                    <button>Scale Up</button>
                    <button>Scale Down</button>
                    <button>Shadowmask CRT Shader v0.1</button>
                    <button>Shadowmask CRT Shader v0.2</button>
                </div>
            </MenuItem>
        </div>
    );
};

export default MenuBar;
