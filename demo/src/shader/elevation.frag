// use highest precision available for floating point claculations
// could probably use lowp unless users want more than 2 decimal point adjustments
precision highp float;

// microseconds since page load - performance.now()
uniform float u_Now;

// pixel coordinates of this fragment, to fetch texture color
varying vec2 v_TextureCoords;

// CRS coordinates of this fragment
varying vec2 v_CRSCoords;

// x/s/u is lng - y/t/v is lat
// lat/lng coordinates of this fragment (linearly interpolated)
varying vec2 v_LatLngCoords;

// first texture pointer - should only make calculations on one texture at a time
uniform sampler2D u_texture0;

void main( void ) {
    vec4 texelColor = texture2D( u_texture0, v_TextureCoords );

    // force alpha channel to 1.0 just in case matrix multiplicatives messed that up
//    texelColor.a = 1.0;

    // set fragment color instructions
    gl_FragColor = texelColor;
}
