vec4 brightness( sampler2D tex, vec2 uv, float u_brightness ) {
    vec4 color = texture2D( tex, uv );
    color.rgb += u_brightness;
    return color;
}

#pragma glslify: export(brightness);
