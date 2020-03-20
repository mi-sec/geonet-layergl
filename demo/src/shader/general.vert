attribute vec2 a_VertexCoords;
attribute vec2 a_TextureCoords;
attribute vec2 a_CRSCoords;
attribute vec2 a_LatLngCoords;

// pixel coordinates of this fragment to fetch texture color
varying vec2 v_TextureCoords;
varying vec2 v_CRSCoords;
varying vec2 v_LatLngCoords;

// TODO:: investigate possible rotation effects - with GPU based computing, it's very possible
// uniform vec2 u_rotation;
// TODO: get back to this. one of these days we might have rotation in leaflet
// vec2 rotatedPosition = vec2(
// 	a_VertexCoords.x * u_rotation.y + a_VertexCoords.y * u_rotation.x,
// 	a_VertexCoords.y * u_rotation.y - a_VertexCoords.x * u_rotation.x
// );

void main( void ) {
    // pass the texCoord to the fragment shader
    // the GPU will interpolate this value between points
    v_TextureCoords = a_TextureCoords;
    v_CRSCoords     = a_CRSCoords;
    v_LatLngCoords  = a_LatLngCoords;

    gl_Position = vec4( a_VertexCoords, 1.0, 1.0 );
}
