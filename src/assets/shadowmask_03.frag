#version 300 es;
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const float SR3 = sqrt(3.0);
const float SR3D2 = SR3 / 2.0;
const float SR3D3 = SR3 / 3.0;
const float HEX_RADIUS = 3.0;
const float PHOSPHOR_RADIUS = 0.866;    // As a proportion of HEX_RADIUS

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
    return vec2(
        (pixel.x * SR3D3 - pixel.y * (1.0 / 3.0 )) / HEX_RADIUS,
        (pixel.y * (2.0 / 3.0)) / HEX_RADIUS
    ) % 1.0;
}

bool inPhosphor(vec2 hex, vec2 pixel) {
    return length(pixel - hex) < PHOSPHOR_RADIUS * HEX_RADIUS;
}

vec3 meanSampleColour(vec2 centre) {
    vec3 colour = texture(uTexture, centre).rgb;
    for (int i = 0; i < 6; i++) {
        colour += texture(uTexture, centre + sampleOffsets[i]).rgb;
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

    vec3 colour = texture(uTexture, uv).rgb;
    // if (inPhosphor(hexCoords, pixel)) {
    //     colour = phosphorColour(hexCoords, meanSampleColour(hexCentre));
    // }
        
    fragColor = vec4(colour, 1.0);
}