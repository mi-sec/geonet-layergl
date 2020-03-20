#pragma glslify: rgb2hsv = require('./rgb2hsv.glsl');

const float draDistanceToNeighborPixel = 1.0 / 256.0;

// add difference of gaussian and perceptual contrast map algorithms
// TODO: make this more advanced than just adaptive gamma correction
//  https://jivp-eurasipjournals.springeropen.com/articles/10.1186/s13640-016-0138-1
vec4 applyDynamicRangeAdjustment( vec4 tex, sampler2D u_texture0, vec2 v_TextureCoords, float u_draGamma ) {
	float result = 0.0;
	float totals = 0.0;

	for ( int x = 0; x < 3; x++ ) {
		for ( int y = 0; y < 3; y++ ) {
			vec4 fragSample = texture2D( u_texture0, v_TextureCoords.st + vec2( x, y ) * draDistanceToNeighborPixel );
			fragSample.xyz  = rgb2hsv( fragSample.rgb );
			result          += fragSample.z;
			totals++;
		}
	}

	result  /= totals;
	tex.rgb = pow( tex.rgb, vec3( 1.0 / ( ( u_draGamma + result ) * 2.0 ) ) );

	return tex;
}

#pragma glslify: export(applyDynamicRangeAdjustment);
