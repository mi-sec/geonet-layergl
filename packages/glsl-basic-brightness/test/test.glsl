precision mediump float;

#pragma glslify: brightness = require('../lib/basic-brightness.glsl');

uniform sampler2D u_texture;

void main() {
    vec4 color = brightness( u_texture, vec2( 0, 0 ), 1.0 );
    gl_FragColor = color;
}
