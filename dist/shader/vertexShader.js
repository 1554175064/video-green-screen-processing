"use strict";

exports.vertexShader = "\n      varying vec2 vUv;\n      void main()\n      {\n      \tvUv = uv;\n      \tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n      \tgl_Position = projectionMatrix * mvPosition;\n      }\n    ";