import { vertexShaderSource, fragmentShaderSource } from "../assets/shadersv2";

export class CRTShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2");

        if (!this.gl) {
            console.error("WebGL 2 not supported");
            return;
        }

        // Create shader program
        const vertexShader = this.createShader(
            this.gl.VERTEX_SHADER,
            vertexShaderSource
        );
        const fragmentShader = this.createShader(
            this.gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );
        this.program = this.createProgram(vertexShader, fragmentShader);

        // Get attribute and uniform locations
        this.aPosition = this.gl.getAttribLocation(this.program, "aPosition");
        this.aTexCoord = this.gl.getAttribLocation(this.program, "aTexCoord");
        this.uResolution = this.gl.getUniformLocation(
            this.program,
            "uResolution"
        );
        this.uTime = this.gl.getUniformLocation(this.program, "uTime");
        this.uCurvature = this.gl.getUniformLocation(
            this.program,
            "uCurvature"
        );
        this.uScanlines = this.gl.getUniformLocation(
            this.program,
            "uScanlines"
        );
        this.uVignette = this.gl.getUniformLocation(this.program, "uVignette");

        // Create buffers
        this.vbo = this.gl.createBuffer();
        this.ibo = this.gl.createBuffer();

        // Create texture
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.NEAREST
        );
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.NEAREST
        );

        // Set up vertex data
        const vertices = new Float32Array([
            -1, -1, 0, 0, 0, 1, -1, 0, 1, 0, -1, 1, 0, 0, 1, 1, 1, 0, 1, 1,
        ]);

        const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            indices,
            this.gl.STATIC_DRAW
        );

        // Animation variables
        this.startTime = Date.now();
        this.curvature = 0.1;
        this.scanlines = 0.5;
        this.vignette = 0.5;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    render(sourceCanvas, shaderScale) {
        const gl = this.gl;

        // Update canvas size if needed
        if (
            this.canvas.width !== sourceCanvas.width * shaderScale / 4 ||
            this.canvas.height !== sourceCanvas.height * shaderScale / 4
        ) {
            this.canvas.width = sourceCanvas.width * shaderScale / 4;
            this.canvas.height = sourceCanvas.height * shaderScale / 4;
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        // Use shader program
        gl.useProgram(this.program);

        // Update texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            sourceCanvas
        );

        // Set uniforms
        gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uTime, (Date.now() - this.startTime) / 1000);
        gl.uniform1f(this.uCurvature, this.curvature);
        gl.uniform1f(this.uScanlines, this.scanlines);
        gl.uniform1f(this.uVignette, this.vignette);

        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 5 * 4, 0);
        gl.enableVertexAttribArray(this.aPosition);

        gl.vertexAttribPointer(
            this.aTexCoord,
            2,
            gl.FLOAT,
            false,
            5 * 4,
            3 * 4
        );
        gl.enableVertexAttribArray(this.aTexCoord);

        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}
