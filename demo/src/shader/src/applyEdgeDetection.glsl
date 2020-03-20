#pragma glslify: applyDynamicRangeAdjustment = require('./applyDynamicRangeAdjustment.glsl');

const float draDistanceToNeighborPixel = 1.0 / 256.0;
mat3 laplacianKernel = mat3(
	-1.0, -1.0, -1.0,
	-1.0, 8.0 , -1.0,
	-1.0, -1.0, -1.0
);

// research Sobel & Prewitt (Prewitt is probably the best candidate)
// research Kirsch & Robinson Compass (poor results)
// try edge algorithms:
// - Sobel
// - Prewitt
// - Roberts
// - Laplacian of Gaussian
// - Zero-cross
// - Canny
vec4 applyEdgeDetection( sampler2D u_texture0, vec2 v_TextureCoords, float u_draGamma ) {
	vec3 acc = vec3( 0, 0, 0 );

	// For each pixel in a 3x3 envelope around our core pixel
	for ( int x = 0; x < 3; x++ ) {
		for ( int y = 0; y < 3; y++ ) {
			vec4 fragSample = texture2D( u_texture0, v_TextureCoords.st + vec2( x, y ) * draDistanceToNeighborPixel );
//			fragSample = 1.0 / applyDynamicRangeAdjustment( fragSample, u_texture0, v_TextureCoords, u_draGamma );
//			fragSample = applyDynamicRangeAdjustment( fragSample, u_texture0, v_TextureCoords, u_draGamma );
			acc += fragSample.rgb * laplacianKernel[ x ][ y ];
		}
	}

	if( length( acc ) >= 0.1 ) {
		acc = vec3( 1.0 );
	}

	//	acc = floor( acc );

	return vec4( abs( acc ), 1.0 );
}

#pragma glslify: export(applyEdgeDetection);
