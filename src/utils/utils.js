function savePixelDataToJson(pixels, width, height, palette, shader) {
    const buffer = pixels.buffer; // Returns an array of bytes of the ArrayBuffer in the range [0, 255].
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return JSON.stringify({ pixels, width, height, palette, shader });
}

function downloadSaveFile(json, filename = "pixelart.json") {
    const jsonString = JSON.stringify(json, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.revokeObjectURL(url);

    // const element = document.createElement("a");
    // element.setAttribute(
    //     "href",
    //     "data:text/plain;charset=utf-8," + encodeURIComponent(json)
    // );
    // element.setAttribute("download", filename);
    // element.style.display = "none";
    // document.body.appendChild(element);
    // element.click();
    // document.body.removeChild(element);
}

function createPixelartBlob(pixels, width, height, palette, shader) {
    const shaderBytes = new TextEncoder().encode(shader);
    const totalSize =
        2 +
        2 +
        pixels.length * 4 +
        1 +
        palette.length * 4 +
        1 +
        shaderBytes.length;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint16(offset, width, true);
    offset += 2;
    view.setUint16(offset, height, true);
    offset += 2;

    const pixelView = new Uint32Array(buffer, offset, pixels.length);
    pixelView.set(pixels);
    offset += pixels.length * 4;

    view.setUint8(offset, palette.length);
    offset += 1;
    for (let color of palette) {
        for (let i = 0; i < 4; i++) {
            view.setUint8(offset + i, color[i]);
        }
    }

    view.setUint8(offset++, shaderBytes.length);
    new Uint8Array(buffer, offset).set(shaderBytes);

    return new Blob([buffer], { type: "application/octet-stream" });
}

function downloadBlob(blob, filename = "pixelart.pix") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function parsePixelartBlob(file) {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    let offset = 0;

    const width = view.getUint16(offset, true);
    offset += 2;
    const height = view.getUint16(offset, true);
    offset += 2;

    const numPixels = width * height;
    const pixels = new Uint32Array(buffer, offset, numPixels);
    offset += numPixels * 4;

    const paletteLength = view.getUint8(offset++);

    const palette = [];
    for (let i = 0; i < paletteLength; i++) {
        const r = view.getUint8(offset++);
        const g = view.getUint8(offset++);
        const b = view.getUint8(offset++);
        const a = view.getUint8(offset++);
        palette.push([r, g, b, a]);
    }

    const shaderLength = view.getUint8(offset++);
    const shaderBytes = new Uint8Array(buffer, offset, shaderLength);
    const shader = new TextDecoder().decode(shaderBytes);

    return { width, height, pixels, palette, shader };
}

export {
    savePixelDataToJson,
    downloadSaveFile,
    createPixelartBlob,
    downloadBlob,
    parsePixelartBlob,
};
