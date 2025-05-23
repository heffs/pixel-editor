#version 300 es
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
