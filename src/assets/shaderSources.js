const SHADERS = [
    //**************************************************************/
    // PASSTHROUGH SHADER
    //**************************************************************/
    {
        name: "Passthrough",
        vertexShaderSource: `#version 300 es
    in vec3 aPosition;
    in vec2 aTexCoord;
    
    out vec2 vTexCoord;
    
    void main() {
        vTexCoord = aTexCoord;
        gl_Position = vec4(aPosition, 1.0);
    }`,
        fragmentShaderSource: `#version 300 es
    precision mediump float;
    
    in vec2 vTexCoord;
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    
    out vec4 fragColor;
    
    void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        
        vec3 colour = texture(uTexture, uv).rgb;
        
        fragColor = vec4(colour, 1.0);
        
    }
    
    
    `,
    },
    //**************************************************************/
    // SHADOW MASK 2
    //**************************************************************/
    {
        name: "Shadow Mask CRT v0.2",
        vertexShaderSource: `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}`,
        fragmentShaderSource: `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const vec3[16] weights = vec3[16](
    vec3(0.5, 0.2, 0.2), vec3(1.0, 0.2, 0.2), vec3(1.0, 0.2, 0.2), vec3(0.5, 0.2, 0.2),
    vec3(0.5, 0.6, 0.2), vec3(1.0, 0.8, 0.7), vec3(1.0, 0.7, 0.8), vec3(0.5, 0.2, 0.6),
    vec3(0.4, 1.0, 0.2), vec3(0.8, 1.0, 0.8), vec3(0.8, 0.8, 1.0), vec3(0.4, 0.2, 1.0),
    vec3(0.2, 1.0, 0.2), vec3(0.2, 1.0, 0.6), vec3(0.2, 0.6, 1.0), vec3(0.2, 0.2, 1.0)
);

const vec2[6] neighbourPositions = vec2[6](
    vec2(0.0, -1.0), vec2(1.0, -0.5), vec2(1.0, 0.5), vec2(0.0, 1.0), vec2(-1.0, 0.5), vec2(-1.0, -0.5)
);

const float w0 = 1.0;
const float w25 = 0.5;
const float w45 = 0.35;
const float w65 = 0.15;
const float w85 = 0.1;
const float w125 = 0.05;

const float[36] neighbourWeights = float[36](
    w125,  w85,  w65,  w65,  w85, w125,
    w85,   w45,  w25,  w25,  w45,  w85,
    w65,   w25,  w0,   w0,   w25,  w65,
    w65,   w25,  w0,   w0,   w25,  w65,
    w85,   w45,  w25,  w25,  w45,  w85,
    w125,  w85,  w65,  w65,  w85, w125
);

const ivec2[18] neighbourOffsets = ivec2[18](
    ivec2(1, 6), ivec2(2, 4), ivec2(0, 4),
    ivec2(-3, 4), ivec2(-2, 2), ivec2(-4, 2),
    ivec2(-3, 0), ivec2(-2, -2), ivec2(-4, -2),
    ivec2(1, -2), ivec2(2, -4), ivec2(0, -4),
    ivec2(5, 0), ivec2(6, -2), ivec2(4, -2),
    ivec2(5, 4), ivec2(6, 2), ivec2(4, 2)
);


vec3 getWeights(ivec2 redWeightCoord, ivec2 greenWeightCoord, ivec2 blueWeightCoord) {
    vec3 weights = vec3(0.0);
    if (redWeightCoord.x < 0 || redWeightCoord.x > 5 || redWeightCoord.y < 0 || redWeightCoord.y > 5) {
        weights.r = 0.0;
    } else {
        weights.r = neighbourWeights[redWeightCoord.x + redWeightCoord.y * 6];
    }

    if (greenWeightCoord.x < 0 || greenWeightCoord.x > 5 || greenWeightCoord.y < 0 || greenWeightCoord.y > 5) {
        weights.g = 0.0;
    } else {
        weights.g = neighbourWeights[greenWeightCoord.x + greenWeightCoord.y * 6];
    }

    if (blueWeightCoord.x < 0 || blueWeightCoord.x > 5 || blueWeightCoord.y < 0 || blueWeightCoord.y > 5) {
        weights.b = 0.0;
    } else {
        weights.b = neighbourWeights[blueWeightCoord.x + blueWeightCoord.y * 6];
    }

    return weights;
}

vec3 meanSampleColour(vec2 sample_origin, float pixelSize) {
    vec3 colour = vec3(0.0);
    for (int y = 0; y < int(pixelSize); y++) {
        for (int x = 0; x < int(pixelSize); x++) {
            vec2 sample_uv = (sample_origin + vec2(x, y)) / uResolution;
            colour += texture(uTexture, sample_uv).rgb;
        }
    }
    return colour / (pixelSize * pixelSize);
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
    
    float pixelSize = 4.0;
    vec2 pixel = uv * uResolution;
    float col = floor(pixel.x / pixelSize);
    float offset = mod(col, 2.0) * pixelSize * 0.5;
    vec2 subpixel = mod(pixel, pixelSize);
    subpixel.y = mod(subpixel.y + offset, pixelSize);
    vec2 sample_origin = pixel - subpixel;

    vec3 meanPixelColour = meanSampleColour(sample_origin, pixelSize);

    int subpixelIndex = int(subpixel.x) + int(subpixel.y) * int(pixelSize);
    vec3 subPixelColour = meanPixelColour * weights[subpixelIndex];

    vec3 finalColour = subPixelColour;

    // Add influence from neighbouring pixels
    for (int i = 0; i < 6; i++) {
        vec2 neighbour_origin = sample_origin + neighbourPositions[i] * pixelSize;
        vec3 neighbour_colour = meanSampleColour(neighbour_origin, pixelSize);

        ivec2 redWeightCoord = neighbourOffsets[i * 3] + ivec2(subpixel);
        ivec2 greenWeightCoord = neighbourOffsets[i * 3 + 1] + ivec2(subpixel);
        ivec2 blueWeightCoord = neighbourOffsets[i * 3 + 2] + ivec2(subpixel);

        vec3 colourDiff = max(neighbour_colour - subPixelColour, vec3(0.0));

        vec3 colourWeights = getWeights(redWeightCoord, greenWeightCoord, blueWeightCoord);

        finalColour += colourDiff * colourWeights;
    }
    
    fragColor = vec4(finalColour, 1.0);
    
}


`,
    },
    //**************************************************************/
    // SHADOW MASK 1.1
    //**************************************************************/
    {
        name: "Shadow Mask CRT v0.11",
        vertexShaderSource: `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}`,
        fragmentShaderSource: `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const vec3[16] weights = vec3[16](
    vec3(0.5, 0.2, 0.2), vec3(1.0, 0.2, 0.2), vec3(1.0, 0.2, 0.2), vec3(0.5, 0.2, 0.2),
    vec3(0.5, 0.6, 0.2), vec3(1.0, 0.8, 0.7), vec3(1.0, 0.7, 0.8), vec3(0.5, 0.2, 0.6),
    vec3(0.4, 1.0, 0.2), vec3(0.8, 1.0, 0.8), vec3(0.8, 0.8, 1.0), vec3(0.4, 0.2, 1.0),
    vec3(0.2, 1.0, 0.2), vec3(0.2, 1.0, 0.6), vec3(0.2, 0.6, 1.0), vec3(0.2, 0.2, 1.0)
);

const vec2[6] neighbourPositions = vec2[6](
    vec2(0.0, -1.0), vec2(1.0, -0.5), vec2(1.0, 0.5), vec2(0.0, 1.0), vec2(-1.0, 0.5), vec2(-1.0, -0.5)
);

const float w0 = 1.0;
const float w25 = 0.5;
const float w45 = 0.35;
const float w65 = 0.15;
const float w85 = 0.1;
const float w125 = 0.05;

const float[36] neighbourWeights = float[36](
    w125,  w85,  w65,  w65,  w85, w125,
    w85,   w45,  w25,  w25,  w45,  w85,
    w65,   w25,  w0,   w0,   w25,  w65,
    w65,   w25,  w0,   w0,   w25,  w65,
    w85,   w45,  w25,  w25,  w45,  w85,
    w125,  w85,  w65,  w65,  w85, w125
);

const ivec2[18] neighbourOffsets = ivec2[18](
    ivec2(1, 6), ivec2(2, 4), ivec2(0, 4),
    ivec2(-3, 4), ivec2(-2, 2), ivec2(-4, 2),
    ivec2(-3, 0), ivec2(-2, -2), ivec2(-4, -2),
    ivec2(1, -2), ivec2(2, -4), ivec2(0, -4),
    ivec2(5, 0), ivec2(6, -2), ivec2(4, -2),
    ivec2(5, 4), ivec2(6, 2), ivec2(4, 2)
);

vec3 getWeights(ivec2 redWeightCoord, ivec2 greenWeightCoord, ivec2 blueWeightCoord) {
    vec3 weights = vec3(0.0);
    if (redWeightCoord.x < 0 || redWeightCoord.x > 5 || redWeightCoord.y < 0 || redWeightCoord.y > 5) {
        weights.r = 0.0;
    } else {
        weights.r = neighbourWeights[redWeightCoord.x + redWeightCoord.y * 6];
    }

    if (greenWeightCoord.x < 0 || greenWeightCoord.x > 5 || greenWeightCoord.y < 0 || greenWeightCoord.y > 5) {
        weights.g = 0.0;
    } else {
        weights.g = neighbourWeights[greenWeightCoord.x + greenWeightCoord.y * 6];
    }

    if (blueWeightCoord.x < 0 || blueWeightCoord.x > 5 || blueWeightCoord.y < 0 || blueWeightCoord.y > 5) {
        weights.b = 0.0;
    } else {
        weights.b = neighbourWeights[blueWeightCoord.x + blueWeightCoord.y * 6];
    }

    return weights;
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;

    float pixelSize = 4.0;
    vec2 pixel = uv * uResolution;
    vec2 subpixel = mod(pixel, pixelSize);
    float col = floor(pixel.x / pixelSize);
    float offset = mod(col, 2.0) * pixelSize * 0.5;
    subpixel.y = mod(subpixel.y + offset, pixelSize);

    vec2 sample_pixel = pixel;
    sample_pixel.y = sample_pixel.y + offset;
    vec2 sample_uv = floor(sample_pixel / pixelSize) * pixelSize + (pixelSize * 0.5);
    sample_uv.y = sample_uv.y - offset;
    sample_uv = sample_uv / uResolution;

    int subpixelIndex = int(subpixel.x) + int(subpixel.y) * int(pixelSize);

    vec4 colour = texture(uTexture, sample_uv);
    vec3 subPixelColour = colour.rgb * weights[subpixelIndex];

    vec3 finalColour = subPixelColour;

    // Add influence from neighbouring pixels
    for (int i = 0; i < 6; i++) {
        vec2 neighbour_uv = sample_uv + neighbourPositions[i] * pixelSize / uResolution;
        vec4 neighbour_colour = texture(uTexture, neighbour_uv);

        ivec2 redWeightCoord = neighbourOffsets[i * 3] + ivec2(subpixel);
        ivec2 greenWeightCoord = neighbourOffsets[i * 3 + 1] + ivec2(subpixel);
        ivec2 blueWeightCoord = neighbourOffsets[i * 3 + 2] + ivec2(subpixel);

        vec3 colourDiff = max(neighbour_colour.rgb - subPixelColour, vec3(0.0));

        vec3 colourWeights = getWeights(redWeightCoord, greenWeightCoord, blueWeightCoord);

        finalColour += colourDiff * colourWeights;
    }

    fragColor = vec4(finalColour, 1.0);

}

`,
    },
    //**************************************************************/
    // SHADOW MASK 3.1
    //**************************************************************/
    {
        name: "Shadow Mask CRT v0.3.1 (Pure True)",
        vertexShaderSource: `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}`,
        fragmentShaderSource: `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const float SR3 = sqrt(3.0);
const float SR3D2 = SR3 / 2.0;
const float SR3D3 = SR3 / 3.0;
const float HEX_RADIUS = 4.0;
const float PHOSPHOR_RADIUS = 0.8;    // As a proportion of HEX_RADIUS

const vec2[6] sampleOffsets = vec2[6](
    vec2(0.0, -1.0) * HEX_RADIUS * 0.6,
    vec2(SR3D2, -0.5) * HEX_RADIUS * 0.6,
    vec2(SR3D2, 0.5) * HEX_RADIUS * 0.6,
    vec2(0.0, 1.0) * HEX_RADIUS * 0.6,
    vec2(-SR3D2, 0.5) * HEX_RADIUS * 0.6,
    vec2(-SR3D2, -0.5) * HEX_RADIUS * 0.6
);

// using q,r radial coordinates, here represented as x,y
vec2 hexToPixel(vec2 hex) {
    return vec2(
        (hex.x * SR3 + hex.y * SR3D2) * HEX_RADIUS, 
        hex.y * 1.5 * HEX_RADIUS
    );
}

// Returns the integer q,r coordinates for the hex that contains the pixel
vec2 pixelToHex(vec2 pixel) {
    return round(vec2(
        (pixel.x * SR3D3 - pixel.y * (1.0 / 3.0 )) / HEX_RADIUS,
        (pixel.y * (2.0 / 3.0)) / HEX_RADIUS
    ));
}

bool inPhosphor(vec2 hex, vec2 pixel) {
    return length(pixel - hex) < PHOSPHOR_RADIUS * HEX_RADIUS;
}

vec3 meanSampleColour(vec2 centre) {
    vec3 colour = texture(uTexture, centre / uResolution).rgb;
    for (int i = 0; i < 6; i++) {
        colour += texture(uTexture, (centre + sampleOffsets[i]) / uResolution).rgb;
    }
    return colour / 7.0;
}

float mod_positive(float n, float m) {
    return mod(mod(n, m) + m, m);
}

vec3 discreteColour(vec3 colour, int index) {
    if (index == 0) {
        return vec3(colour.r, 0.0, 0.0);
    } else if (index == 1) {
        return vec3(0.0, colour.g, 0.0);
    } else {
        return vec3(0.0, 0.0, colour.b);
    }
}

vec3 phosphorColour(vec2 hex, vec3 meanColour) {
    int q_column = int(mod_positive(hex.x, 3.0));
    int r_row = int(mod_positive(hex.y, 3.0));
    if (q_column == 0) {
        if (r_row == 0) {
            return discreteColour(meanColour, 0);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 2);
        } else {
            return discreteColour(meanColour, 1);
        }
    } else if (q_column == 1) {
        if (r_row == 0) {
            return discreteColour(meanColour, 1);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 0);
        } else {
            return discreteColour(meanColour, 2);
        }
    } else {
        if (r_row == 0) {
            return discreteColour(meanColour, 2);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 1);
        } else {
            return discreteColour(meanColour, 0);
        }
    }
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;

    vec2 pixel = uv * uResolution;

    vec2 hexCoords = pixelToHex(pixel);     // q,r coordinates of the hex
    vec2 hexCentre = hexToPixel(hexCoords);     // the pixel coordinate centre of the hex

    // vec3 colour = texture(uTexture, uv).rgb;
    // colour = phosphorColour(hexCoords, colour);

    vec3 colour = vec3(0.0);
    if (inPhosphor(hexCentre, pixel)) {
        vec3 meanColour = meanSampleColour(hexCentre);
        colour = phosphorColour(hexCoords, meanColour);
        // colour = phosphorColour(hexCoords, texture(uTexture, uv).rgb);
    }

    // if (inPhosphor(hexCoords, pixel)) {
    //     colour = phosphorColour(hexCoords, meanSampleColour(hexCentre));
    // }
        
    fragColor = vec4(colour, 1.0);
}        `,
    },
    //**************************************************************/
    // SHADOW MASK 3.2
    //**************************************************************/
    {
        name: "Shadow Mask CRT v0.3.2",
        vertexShaderSource: `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}`,
        fragmentShaderSource: `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const float SR3 = sqrt(3.0);
const float SR3D2 = SR3 / 2.0;
const float SR3D3 = SR3 / 3.0;
const float HEX_RADIUS = 4.0;
const float PHOSPHOR_RADIUS = 0.8;    // As a proportion of HEX_RADIUS
const float COLOUR_FACTOR = 0.25;

const vec2[6] sampleOffsets = vec2[6](
    vec2(0.0, -1.0) * HEX_RADIUS * 0.6,
    vec2(SR3D2, -0.5) * HEX_RADIUS * 0.6,
    vec2(SR3D2, 0.5) * HEX_RADIUS * 0.6,
    vec2(0.0, 1.0) * HEX_RADIUS * 0.6,
    vec2(-SR3D2, 0.5) * HEX_RADIUS * 0.6,
    vec2(-SR3D2, -0.5) * HEX_RADIUS * 0.6
);

// using q,r radial coordinates, here represented as x,y
vec2 hexToPixel(vec2 hex) {
    return vec2(
        (hex.x * SR3 + hex.y * SR3D2) * HEX_RADIUS, 
        hex.y * 1.5 * HEX_RADIUS
    );
}

// Returns the integer q,r coordinates for the hex that contains the pixel
vec2 pixelToHex(vec2 pixel) {
    return round(vec2(
        (pixel.x * SR3D3 - pixel.y * (1.0 / 3.0 )) / HEX_RADIUS,
        (pixel.y * (2.0 / 3.0)) / HEX_RADIUS
    ));
}

bool inPhosphor(vec2 hex, vec2 pixel) {
    return length(pixel - hex) < PHOSPHOR_RADIUS * HEX_RADIUS;
}

vec3 meanSampleColour(vec2 centre) {
    vec3 colour = texture(uTexture, centre / uResolution).rgb;
    for (int i = 0; i < 6; i++) {
        colour += texture(uTexture, (centre + sampleOffsets[i]) / uResolution).rgb;
    }
    return colour / 7.0;
}

float mod_positive(float n, float m) {
    return mod(mod(n, m) + m, m);
}

vec3 discreteColour(vec3 colour, int index) {
    if (index == 0) {
        return vec3(colour.r, colour.g * colour.g * COLOUR_FACTOR, colour.b * colour.b * COLOUR_FACTOR);
    } else if (index == 1) {
        return vec3(colour.r * colour.r * COLOUR_FACTOR, colour.g, colour.b * colour.b * COLOUR_FACTOR);
    } else {
        return vec3(colour.r * colour.r * COLOUR_FACTOR, colour.g * colour.g * COLOUR_FACTOR, colour.b);
    }
}

vec3 phosphorColour(vec2 hex, vec3 meanColour) {
    int q_column = int(mod_positive(hex.x, 3.0));
    int r_row = int(mod_positive(hex.y, 3.0));
    if (q_column == 0) {
        if (r_row == 0) {
            return discreteColour(meanColour, 0);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 2);
        } else {
            return discreteColour(meanColour, 1);
        }
    } else if (q_column == 1) {
        if (r_row == 0) {
            return discreteColour(meanColour, 1);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 0);
        } else {
            return discreteColour(meanColour, 2);
        }
    } else {
        if (r_row == 0) {
            return discreteColour(meanColour, 2);
        } else if (r_row == 1) {
            return discreteColour(meanColour, 1);
        } else {
            return discreteColour(meanColour, 0);
        }
    }
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;

    vec2 pixel = uv * uResolution;

    vec2 hexCoords = pixelToHex(pixel);     // q,r coordinates of the hex
    vec2 hexCentre = hexToPixel(hexCoords);     // the pixel coordinate centre of the hex

    vec3 colour = vec3(0.0);
    if (inPhosphor(hexCentre, pixel)) {
        vec3 meanColour = meanSampleColour(hexCentre);
        colour = phosphorColour(hexCoords, meanColour);
        // colour = phosphorColour(hexCoords, texture(uTexture, uv).rgb);
    } else {
        colour = texture(uTexture, uv).rgb;
        colour = colour * colour * COLOUR_FACTOR;
    }  

    fragColor = vec4(colour, 1.0);
}        `,
    },
];

export { SHADERS };
