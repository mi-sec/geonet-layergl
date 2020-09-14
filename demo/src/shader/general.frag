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

uniform float u_brightness;
uniform float u_contrast;
uniform float u_rangeCenter;
uniform float u_rangeWidth;
uniform float u_sharpen;
uniform float u_sharpenRadius;
uniform float u_nightVision;

//#pragma glslify: pointInBBox     = require('./src/pointInBBox.glsl');
//#pragma glslify: rgb2hsv         = require('./src/rgb2hsv.glsl');
//#pragma glslify: hsv2rgb         = require('./src/hsv2rgb.glsl');
#pragma glslify: applyBrightness = require('./src/applyBrightness.glsl');
#pragma glslify: applyContrast   = require('./src/applyContrast.glsl');
#pragma glslify: applySharpen    = require('./src/applySharpen.glsl');

//#pragma glslify: applyDynamicRangeAdjustment = require('./src/applyDynamicRangeAdjustment.glsl');
#pragma glslify: applyNightVision            = require('./src/applyNightVision.glsl');
//#pragma glslify: applyEdgeDetection          = require('./src/applyEdgeDetection.glsl');

void main( void ) {
    vec4 texelColor = texture2D( u_texture0, v_TextureCoords );

    // apply brightness
    // must do before applying contrast because brightness adjustment to a clamped vector is muddy and inaccurate
    texelColor = applyBrightness( texelColor, u_brightness );

    // apply contrast
    texelColor = applyContrast( texelColor, u_contrast, u_rangeCenter, u_rangeWidth );

    // apply sharpen
    texelColor = applySharpen( texelColor, u_texture0, v_TextureCoords, u_sharpen, u_sharpenRadius );

    // apply night vision
    if( u_nightVision == 1.0 ) {
        texelColor = applyNightVision( texelColor, u_texture0, v_TextureCoords );
    }

    // force alpha channel to 1.0 just in case matrix multiplicatives messed that up
    texelColor.a = 1.0;

    // set fragment color instructions
    gl_FragColor = texelColor;
}
