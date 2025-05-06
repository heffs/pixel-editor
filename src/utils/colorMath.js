export function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
        default:
            r = g = b = 0;
    }

    r = Math.floor(r * 100);
    g = Math.floor(g * 100);
    b = Math.floor(b * 100);
    console.log(r, g, b);
    return { r, g, b };
}

export function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h, s, v;

    if (delta === 0) {
        h = 0;
        s = 0;
        v = max;
    } else {
        s = delta / max;

        if (max === r) {
            h = (g - b) / delta;
        } else if (max === g) {
            h = 2 + (b - r) / delta;
        } else {
            h = 4 + (r - g) / delta;
        }

        h = Math.round(h * 60);
        s = Math.round(s * 100);
        v = Math.round(v * 100);
    }

    return { h, s, v };
}

export function rgbToHex (r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export function rgbaToUint32(r, g, b, a) {
    const res = (a << 24) + (b << 16) + (g << 8) + r;
    return res;
}

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function hexToUint32(hex) {
    const rgb = hexToRgb(hex);
    const u = rgbaToUint32(rgb.r, rgb.g, rgb.b, 255);
    return rgbaToUint32(rgb.r, rgb.g, rgb.b, 255);
}

export function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return rgbToHex(r, g, b);
}
