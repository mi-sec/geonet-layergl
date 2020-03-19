attribute vec2 a_VertexCoords;
attribute vec2 a_TextureCoords;
attribute vec2 a_CRSCoords;
attribute vec2 a_LatLngCoords;

varying vec2 v_TextureCoords;
varying vec2 v_CRSCoords;
varying vec2 v_LatLngCoords;

void main( void ) {
	v_TextureCoords = a_TextureCoords;
	v_CRSCoords     = a_CRSCoords;
	v_LatLngCoords  = a_LatLngCoords;
	gl_Position = vec4( a_VertexCoords, 1.0, 1.0 );
}
