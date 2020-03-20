'use strict';

const
    fs         = require( 'fs' ),
    { expect } = require( 'chai' ),
    glslify    = require( 'glslify' ),
    GL         = require( 'gl' );

const
    VERT_SHADER = fs.readFileSync( `${ __dirname }/test.vert.glsl` ).toString(),
    SHADER      = fs.readFileSync( `${ __dirname }/test.glsl` ).toString();

describe( '@mi-sec/glsl-basic-brightness Test', () => {
    const
        width      = 16,
        height     = 16,
        gl         = GL( width, height ),
        vertShader = glslify`${ VERT_SHADER }`;

    let parsedShader, vert, frag;

    before( () => {
        vert = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vert, vertShader );
        gl.compileShader( vert );
    } );

    it( 'glslify should parse the shader', () => {
        parsedShader = glslify`${ SHADER }`;
        expect( parsedShader ).to.not.eq( null );
    } );

    it( 'gl should be able to compile the shader', () => {
        frag = gl.createShader( gl.FRAGMENT_SHADER );

        gl.shaderSource( frag, parsedShader );
        gl.compileShader( frag );

        const compiled = gl.getShaderParameter( frag, gl.COMPILE_STATUS );
        if ( !compiled ) {
            const err = gl.getShaderInfoLog( frag );
            console.error( `Error compiling shader "${ frag }": ${ err }` );
            gl.deleteShader( frag );
            return null;
        }
    } );

    it( 'gl should brighten buffer data', () => {
        const program = gl.createProgram();

        gl.attachShader( program, vert );
        gl.attachShader( program, frag );
        gl.linkProgram( program );

        const linked = gl.getProgramParameter( program, gl.LINK_STATUS );
        if ( !linked ) {
            const err = gl.getProgramInfoLog( program );
            console.error( 'Error in program linking:' + err );
            gl.deleteProgram( program );
            return null;
        }

        gl.useProgram( program );

        const buffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array( [
                -1.0, -1.0,
                1.0, -1.0,
                -1.0, 1.0,
                -1.0, 1.0,
                1.0, -1.0,
                1.0, 1.0
            ] ),
            gl.STATIC_DRAW
        );

        const posLoc = gl.getAttribLocation( program, 'a_position' );

        gl.enableVertexAttribArray( posLoc );
        gl.vertexAttribPointer( posLoc, 2, gl.FLOAT, false, 0, 0 );

        gl.drawArrays( gl.TRIANGLES, 0, 6 );

        const pixels = new Uint8Array( width * height * 4 );
        gl.readPixels( 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

        expect( pixels ).to.deep.eq( new Uint8Array( width * height * 4 ).fill( 255 ) );
    } );

    after( () => {
        gl.destroy();
    } );
} );
