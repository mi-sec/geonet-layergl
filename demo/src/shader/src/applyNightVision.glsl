const float draDistanceToNeighborPixel = 1.0 / 256.0;

vec4 applyNightVision( vec4 tex, sampler2D u_texture0, vec2 v_TextureCoords, float u_draGamma ) {
	vec4 fragSample;
	vec4 original = tex;

	mat3 draKernel = mat3(
		0           , -1.0 * tex.a     , 0,
		-1.0 * tex.a, 1.0 + 4.0 * tex.a, -1.0 * tex.a,
		0           , -1.0 * tex.a     , 0
	);

	for ( int x = 0; x < 3; x++ ) {
		for ( int y = 0; y < 3; y++ ) {
			fragSample = texture2D( u_texture0, v_TextureCoords.st + vec2( x, y ) * draDistanceToNeighborPixel );
			tex.rgb += fragSample.rgb * draKernel[ x ][ y ];
		}
	}

	float gamma = 0.98;
	tex.rgb     = pow( tex.rgb * draKernel, vec3( 1.0 / gamma ) );

	return tex;
}

#pragma glslify: export(applyNightVision);
