vec4 applyContrast( vec4 tex, float u_contrast, float u_rangeCenter, float u_rangeWidth ) {
	if( u_contrast > 0.0 ) {
		tex.rgb = ( tex.rgb - 0.5 ) / ( 1.0 - u_contrast ) + 0.5;
	} else {
		tex.rgb = ( tex.rgb - 0.5 ) * ( 1.0 + u_contrast ) + 0.5;
	}

	return vec4(
		clamp(
			// minus matrix by center range and divide by width of applied contrast (normalize by 0.5)
			( tex.rgb - u_rangeCenter ) / u_rangeWidth + 0.5,
			0.0,
			1.0
		),
		tex.a
	);
}

#pragma glslify: export(applyContrast);
