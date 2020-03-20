uniform float u_brightness;

vec4 applyBrightness( vec4 tex, float u_brightness ) {
	// TODO: clamp this to 0.0 - ~0.7
	// TODO: mix this vector adjustment with relative contrast adjustments because texture gets white washed
	tex.rgb += u_brightness;
	return tex;
}

#pragma glslify: export(applyBrightness);
