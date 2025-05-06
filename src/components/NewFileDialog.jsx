import { useState } from "react";
import "./NewFileDialog.css";

function NewFileDialog({ isOpen, onClose, onCreate }) {
    const [width, setWidth] = useState(16);
    const [height, setHeight] = useState(16);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(width, height);
        onClose();
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog">
                <h2>New Image</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            Width:
                            <input
                                type="number"
                                min="1"
                                max="512"
                                value={width}
                                onChange={(e) =>
                                    setWidth(parseInt(e.target.value) || 1)
                                }
                            />
                        </label>
                    </div>
                    <div className="form-group">
                        <label>
                            Height:
                            <input
                                type="number"
                                min="1"
                                max="512"
                                value={height}
                                onChange={(e) =>
                                    setHeight(parseInt(e.target.value) || 1)
                                }
                            />
                        </label>
                    </div>
                    <div className="dialog-buttons">
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewFileDialog;
