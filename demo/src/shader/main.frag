precision highp float;

uniform float u_Now;
uniform sampler2D u_texture0;

varying vec2 v_TextureCoords;
varying vec2 v_CRSCoords;
varying vec2 v_LatLngCoords;

void main( void ) {
	vec4 texelColor = texture2D( u_texture0, v_TextureCoords );
	gl_FragColor = texelColor;
}
