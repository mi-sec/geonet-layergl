// this method applies a mix of hysteresis thresholding and the laplace operator (laplacian kernel)
// https://scikit-image.org/docs/dev/auto_examples/filters/plot_hysteresis.html
// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3852310/
// the laplacian kernel is a 3x3 matrix kernel where the center is 8 and the surrounding kernel weights are -1
// by multiplying through the positive coefficient by 100/100 (essentially 1)
vec4 applySharpen( vec4 tex, sampler2D u_texture0, vec2 v_TextureCoords, float u_sharpen, float u_sharpenRadius ) {
	mat3 laplacianKernel = mat3(
		-1.0, -1.0, -1.0,
		-1.0, 8.0 , -1.0,
		-1.0, -1.0, -1.0
	);

	float size = 1.0 / u_sharpenRadius;

	for ( int x = 0; x < 3; x++ ) {
		for ( int y = 0; y < 3; y++ ) {
			vec4 tileSample = texture2D( u_texture0, v_TextureCoords.st + vec2( x, y ) * size );
			float frac      = abs( ( 1.0 - ( size * 1.0 ) ) * u_sharpen );
			tex.rgb         += tileSample.rgb * laplacianKernel[ x ][ y ] * frac;
			tex             = mix( tileSample, tex, 1.0 );
		}
	}

	return tex;
}

#pragma glslify: export(applySharpen);
