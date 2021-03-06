/*
 * @class GridLayer.GL
 * @inherits GridLayer
 *
 * This `GridLayer` runs some WebGL code on each grid cell, and puts an image
 * with the result back in place.
 *
 * The contents of each cell can be purely synthetic (based only on the cell
 * coordinates), or be based on some remote tiles (used as textures in the WebGL
 * shaders).
 *
 * The fragment shader is assumed to receive two `vec2` attributes, with the CRS
 * coordinates and the texture coordinates: `aCRSCoords` and `aTextureCoords`.
 * If textures are used, they are accesed through the uniforms `uTexture0` through `uTexture7`
 * There will always be four vertices forming two triangles (a quad).
 *
 */

/**
 * @class LayerGl
 * @extends L.GridLayer
 * @description
 * WebGL for tile layers.
 * runs each tile layer cell image data or other form of tile-based data through WebGL shaders
 */
L.TileLayer.LayerGl = L.GridLayer.extend( {
    /**
     * options
     * @description
     * layer options
     * @type {Object}
     *
     * @property {object} uniforms
     * a key-value list of names and initial values for shader uniforms. values must be `number` or `Array[1-4]`
     *
     * @property {object} tileLayers
     * a key-value list of tile layers where the key is the texture uniform referenced in the shader
     * ```
     * { u_texture0: L.tileLayer.wms( ... ) }
     * // u_texture0 will be linked to the shader and can be referenced
     * ```
     *
     * @property {string} vertexShader
     * string representing the GLSL vertex shader to be run.
     * vertex shaders handle the processing of individual vertices.
     * vertex shader must include:
     * - **attributes** (attribute is supported in vertex shader only, attributes passed in from js program links)
     *      - `attribute vec2 a_VertexCoords;`
     *          - `vec2` attribute declaration defining the vertex coordinates in webgl space (where in the canvas)
     *      - `attribute vec2 a_TextureCoords;`
     *          - `vec2` attribute declaration defining texture coordinate in texture space (where in the texture)
     *      - `attribute vec2 a_CRSCoords;`
     *          - `vec2` attribute declaration defining texture coordinate in projection space
     *      - `attribute vec2 a_LatLngCoords;`
     *          - `vec2` attribute declaration defining texture coordinate in world space
     * - **varying** (varying values passed to fragment shader)
     *      - `varying vec2 v_TextureCoords;`
     *          - `vec2` texture coordinates passed to the fragment
     *      - `varying vec2 v_CRSCoords;`
     *          - `vec2` projection coordinates passed to the fragment
     *      - `varying vec2 v_LatLngCoords;`
     *          - `vec2` lat/lng coordinates passed to the fragment
     * - `void main( void ) { ... }`
     *  - main function to set varying declarations passed to the fragment
     * ```
     * attribute vec2 a_VertexCoords;
     * attribute vec2 a_TextureCoords;
     * attribute vec2 a_CRSCoords;
     * attribute vec2 a_LatLngCoords;
     *
     * varying vec2 v_TextureCoords;
     * varying vec2 v_CRSCoords;
     * varying vec2 v_LatLngCoords;
     *
     * void main( void ) {
     *      v_TextureCoords = a_TextureCoords;
     *      v_CRSCoords     = a_CRSCoords;
     *      v_LatLngCoords  = a_LatLngCoords;
     *      gl_Position = vec4( a_VertexCoords, 1.0, 1.0 );
     * }
     * ```
     *
     * @property {string} fragmentShader
     * string representing the GLSL fragment shader to be run.
     * fragment shaders handle the processing of individual vertex fragments
     * fragments shader must include:
     * - **precision** declaration for float types
     *      - `precision <precision> float;`
     *          - `precision highp float;` - recommend using `highp` float precision for best results
     * - **uniform** (uniform passed in from js program links)
     *      - `uniform float u_Now;`
     *          - `float` to reference the performance timing
     *      - `uniform sampler2D u_texture0;`
     *          - `sampler2D` passed in from the {@link LayerGl#tileLayers}
     *          - references the image sample passed to each fragment
     * - **varying** (varying values passed from vertex shader)
     *      - `varying vec2 v_TextureCoords;`
     *          - `vec2` varying declaration defining fragment coordinates in texture space
     *      - `varying vec2 v_CRSCoords;`
     *          - `vec2` varying declaration defining fragment coordinates in projection space
     *      - `varying vec2 v_LatLngCoords;`
     *          - `vec2` varying declaration defining fragment coordinates in lat/lng space
     * - `void main( void ) { ... }`
     *  - main function to set varying declarations. results of the fragment are passed back to canvas by setting
     *  `gl_FragColor`
     * - **glabals**
     *      - `gl_FragColor` is the result of the fragment color and must be set to carry results to the end of the
     *      program
     *
     * ```
     * precision highp float;
     *
     * uniform float u_Now;
     * uniform sampler2D u_texture0;
     *
     * varying vec2 v_TextureCoords;
     * varying vec2 v_CRSCoords;
     * varying vec2 v_LatLngCoords;
     *
     * void main( void ) {
     *      vec4 texelColor = texture2D( u_texture0, v_TextureCoords );
     *      gl_FragColor = texelColor;
     * }
     * ```
     *
     * @property {array} extensions
     * extensions to load into the WebGL program.
     * the default program requires linear filtering for floating-point textures so
     * [`OES_texture_float_linear`](https://www.khronos.org/registry/OpenGL/extensions/OES/OES_texture_float_linear.txt)
     * extension is hardcoded in {@link LayerGl#initialize}
     *
     * @alias LayerGl#options
     * @memberOf LayerGl#
     */
    options: {
        uniforms: {},
        tileLayers: {},
        vertexShader: '',
        fragmentShader: '',
        extensions: []
    },

    /**
     * initialize
     * @description
     * leaflet initialize method
     * instantiating the layer will initialize all the GL context and upload shaders and vertex buffers to the GPU
     * (the vertices will stay the same for all tiles).
     * @param {object} [options={}] - layer options
     * @alias initialize
     * @memberOf LayerGl#
     */
    initialize( options = {} ) {
        options = L.setOptions( this, options );

        this._renderer = L.DomUtil.create( 'canvas' );

        this._renderer.width = this._renderer.height = options.tileSize;

        this._gl = (
            this._renderer.getContext( 'webgl', { premultipliedAlpha: false } ) ||
            this._renderer.getContext( 'experimental-webgl', { premultipliedAlpha: false } )
        );

        this._gl.viewportWidth = this._gl.viewportHeight = options.tileSize;

        this._glError = false;

        // init textures
        this._textures             = [];
        this._tileLayerUniformKeys = Object.keys( options.tileLayers );

        this._loadGLProgram();

        this._tileLayers = this._tileLayerUniformKeys.map(
            ( key, i ) => {
                this._textures[ i ] = this._gl.createTexture();
                this._gl.uniform1i( this._gl.getUniformLocation( this._glProgram, key ), i );

                return options.tileLayers[ key ];
            }
        );

        this._gl.getExtension( 'OES_texture_float_linear' );

        for ( let i = 0; i < options.extensions.length; i++ ) {
            this._gl.getExtension( options.extensions[ i ] );
        }
    },

    /**
     * getGlError
     * @memberOf LayerGl~
     * @description
     * if any compiling/linking errors occur in the shaders, returns a string with information about that error
     * @return {string|undefined} - glError if exists
     */
    getGlError() {
        return this._glError;
    },

    /**
     * _linkShader
     * @memberOf LayerGl~
     * @description
     * shader type being linked
     * @param {string} shaderCode
     * shader code to compile and link
     * @param {('VERTEX_SHADER'|'FRAGMENT_SHADER')} type
     * `VERTEX_SHADER` or `FRAGMENT_SHADER` type being linked
     * @return {WebGLShader}
     * returns `WebGLShader` if link succeeds
     */
    _linkShader( shaderCode, type ) {
        if ( !shaderCode || typeof shaderCode !== 'string' ) {
            throw new Error( '"shaderCode" is required and must be type "string"' );
        }
        else if ( type !== this._gl.VERTEX_SHADER && type !== this._gl.FRAGMENT_SHADER ) {
            throw new Error( '"type" must be VERTEX_SHADER or FRAGMENT_SHADER' );
        }

        const shader = this._gl.createShader( type );

        this._gl.shaderSource( shader, shaderCode );
        this._gl.compileShader( shader );

        // @event shaderError
        // Fired when there was an error creating the shaders.
        if ( !this._gl.getShaderParameter( shader, this._gl.COMPILE_STATUS ) ) {
            this._glError = this._gl.getShaderInfoLog( shader );
            console.error( this._glError );
            throw new Error( this._glError );
        }

        this._gl.attachShader( this._glProgram, shader );

        return shader;
    },

    /**
     * _loadGLProgram
     * @memberOf LayerGl~
     * @description
     * create, compile, link, and use the primary webgl program
     *
     * once loaded and uniforms initialized, create three data buffer with 8 elements each
     * - `_CRSBuffer` - the `easting, northing` CRS coords
     * - `_LatLngBuffer` - the `easting, northing` lat/lng coords
     * - the `s, t` (also referred to as `u, v`) texture coords and the viewport coords for each of the 4 vertices
     *
     * data for the texel and viewport coords is static, and needs to be declared only once
     */
    _loadGLProgram() {
        this._getUniformSizes();

        /**
         * _glProgram
         * @alias LayerGl._glProgram
         * @description
         * primary `WebGLProgram` created
         * @type {WebGLProgram}
         */
        this._glProgram = this._gl.createProgram();

        const
            vertexShader   = this._linkShader( this.options.vertexShader, this._gl.VERTEX_SHADER ),
            fragmentShader = this._linkShader( this.options.fragmentShader, this._gl.FRAGMENT_SHADER );

        if ( !vertexShader || !fragmentShader ) {
            throw new Error( 'shaders failed to link' );
        }

        this._gl.linkProgram( this._glProgram );
        this._gl.useProgram( this._glProgram );

        // There will be two vec2 vertex attributes per vertex - aCRSCoords and aTextureCoords
        this._aVertexPosition = this._gl.getAttribLocation( this._glProgram, 'a_VertexCoords' );
        this._aTexPosition    = this._gl.getAttribLocation( this._glProgram, 'a_TextureCoords' );
        this._aCRSPosition    = this._gl.getAttribLocation( this._glProgram, 'a_CRSCoords' );
        this._aLatLngPosition = this._gl.getAttribLocation( this._glProgram, 'a_LatLngCoords' );

        this._initUniforms( this._glProgram );

        // if the shader is time-dependent (animated in any way), or has custom uniforms, init the texture cache
        if ( this._isReRenderable ) {
            this._fetchedTextures = {};
            this._2dContexts      = {};
        }

        /**
         * _CRSBuffer
         * @alias LayerGl._CRSBuffer
         * @description
         * the `easting, northing` CRS coords buffer
         * @type {WebGLBuffer}
         */
        this._CRSBuffer = this._gl.createBuffer();
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._CRSBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( 8 ), this._gl.STATIC_DRAW );

        if ( this._aCRSPosition !== -1 ) {
            this._gl.enableVertexAttribArray( this._aCRSPosition );
            this._gl.vertexAttribPointer( this._aCRSPosition, 2, this._gl.FLOAT, false, 8, 0 );
        }

        /**
         * _LatLngBuffer
         * @alias LayerGl._LatLngBuffer
         * @description
         * the `easting, northing` lat/lng coords buffer
         * @type {WebGLBuffer}
         */
        this._LatLngBuffer = this._gl.createBuffer();
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._LatLngBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( 8 ), this._gl.STATIC_DRAW );

        if ( this._aLatLngPosition !== -1 ) {
            this._gl.enableVertexAttribArray( this._aLatLngPosition );
            this._gl.vertexAttribPointer( this._aLatLngPosition, 2, this._gl.FLOAT, false, 8, 0 );
        }

        /**
         * _TexCoordsBuffer
         * @alias LayerGl._TexCoordsBuffer
         * @description
         * the texel coords buffer
         * @type {WebGLBuffer}
         */
        this._TexCoordsBuffer = this._gl.createBuffer();
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._TexCoordsBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( [
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ] ), this._gl.STATIC_DRAW );

        if ( this._aTexPosition !== -1 ) {
            this._gl.enableVertexAttribArray( this._aTexPosition );
            this._gl.vertexAttribPointer( this._aTexPosition, 2, this._gl.FLOAT, false, 8, 0 );
        }

        /**
         * _VertexCoordsBuffer
         * @alias LayerGl._VertexCoordsBuffer
         * @description
         * the vertex coords buffer
         * @type {WebGLBuffer}
         */
        this._VertexCoordsBuffer = this._gl.createBuffer();
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._VertexCoordsBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( [
            1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0
        ] ), this._gl.STATIC_DRAW );

        if ( this._aVertexPosition !== -1 ) {
            this._gl.enableVertexAttribArray( this._aVertexPosition );
            this._gl.vertexAttribPointer( this._aVertexPosition, 2, this._gl.FLOAT, false, 8, 0 );
        }
    },

    /**
     * _getUniformSizes
     * @memberOf LayerGl~
     * @description
     * determines the size of the default values given for the uniforms.
     * loads a string value for defining the uniforms in the shader header into `_uniformSizes`
     */
    _getUniformSizes() {
        /**
         * _uniformSizes
         * @alias LayerGl._uniformSizes
         * @description
         * determines the size of the default values given for the uniforms and loads the uniform name from the
         * shader header
         * @type {Object}
         */
        this._uniformSizes = {};

        for ( const uniformKey in this.options.uniforms ) {
            const defaultValue = this.options.uniforms[ uniformKey ];

            if ( typeof defaultValue === 'number' ) {
                this._uniformSizes[ uniformKey ] = 0;
            }
            else if ( Array.isArray( defaultValue ) ) {
                if ( defaultValue.length > 4 ) {
                    throw new Error( 'Max size for uniform value is 4 elements' );
                }

                this._uniformSizes[ uniformKey ] = defaultValue.length;
            }
            else {
                throw new Error(
                    'Default value for uniforms must be either number or array of numbers'
                );
            }
        }
    },

    /**
     * _initUniforms
     * @memberOf LayerGl~
     * @description
     * initializes the `u_Now` uniform, and user-provided uniforms from the current GL program.
     * sets the `_isReRenderable` property if there are any set uniforms.
     * @param {WebGLProgram} program - WebGlProgram (using as param to support multiple programs in the future)
     * {@link LayerGl._glProgram} created - must be linked to extract uniform locations
     */
    _initUniforms( program ) {
        this._uNowPosition   = this._gl.getUniformLocation( program, 'u_Now' );
        this._isReRenderable = false;

        if ( this._uNowPosition ) {
            this._gl.uniform1f( this._uNowPosition, performance.now() );
            this._isReRenderable = true;
        }

        this._uniformLocations = {};

        for ( const uniformKey in this.options.uniforms ) {
            this._uniformLocations[ uniformKey ] = this._gl.getUniformLocation( program, uniformKey );
            this.setUniform( uniformKey, this.options.uniforms[ uniformKey ] );
            this._isReRenderable = true;
        }
    },

    /**
     * _render
     * @memberOf LayerGl~
     * @description
     * called once per tile - uses the layer's GL context to render a tile, passing the complex space coordinates to
     * the GPU, and asking to render the vertexes (as triangles) again.
     * it is not necessary to clear the WebGL context, because the shader will overwrite all the pixel values.
     * @param {{x: number, y: number, z: number}} coords
     * coords passed in from {@link LayerGl~createTile}
     */
    _render( coords ) {
        this._gl.viewport( 0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight );

        this._gl.enable( this._gl.BLEND );

        const
            tileBounds = this._tileCoordsToBounds( coords ),
            west       = tileBounds.getWest(),
            east       = tileBounds.getEast(),
            north      = tileBounds.getNorth(),
            south      = tileBounds.getSouth(),
            // create data array for LatLng buffer
            latLngData = [
                // Vertex 0
                east, north,

                // Vertex 1
                west, north,

                // Vertex 2
                east, south,

                // Vertex 3
                west, south
            ];

        // upload buffer to GPU
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._LatLngBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( latLngData ), this._gl.STATIC_DRAW );

        // create data array for CRS buffer
        const
            crs     = this._map.options.crs,
            min     = crs.project( L.latLng( south, west ) ),
            max     = crs.project( L.latLng( north, east ) ),
            crsData = [
                // Vertex 0
                max.x, max.y,

                // Vertex 1
                min.x, max.y,

                // Vertex 2
                max.x, min.y,

                // Vertex 3
                min.x, min.y
            ];

        // upload buffer to GPU
        this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._CRSBuffer );
        this._gl.bufferData( this._gl.ARRAY_BUFFER, new Float32Array( crsData ), this._gl.STATIC_DRAW );

        // draw arrays
        this._gl.drawArrays( this._gl.TRIANGLE_STRIP, 0, 4 );
    },

    /**
     * _bindTexture
     * @memberOf LayerGl~
     * @description
     * binds a `ImageData` (`HTMLImageElement`, `HTMLCanvasElement` or `ImageBitmap`) to a texture, given its index
     * (0 to 7). the image data is assumed to be in 8-bit RGBA format. TEXTURE0 corresponds to the
     * WebGL pointer 0x84C0 - add index integer to specify texture channel pointer
     * @param {number} index - index of texture uniform
     * @param {TexImageSource} imageData - image data from tile data ref: {@link LayerGl~createTile}
     */
    _bindTexture( index, imageData ) {
        this._gl.activeTexture( this._gl.TEXTURE0 + index );
        this._gl.bindTexture( this._gl.TEXTURE_2D, this._textures[ index ] );
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.RGBA,
            this._gl.RGBA,
            this._gl.UNSIGNED_BYTE,
            imageData
        );

        this._gl.texParameteri( this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_NEAREST );
        this._gl.texParameteri( this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR );
        this._gl.texParameteri( this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE );
        this._gl.texParameteri( this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE );
        this._gl.generateMipmap( this._gl.TEXTURE_2D );
    },

    /**
     * _bindTextureArrays
     * @memberOf LayerGl~
     * @description
     * binds an array of `TypedArrays` (array containing `Float32Array`) , given its index (0 to 7).
     * the image data is assumed to **not** be in 8-bit RGBA format.
     * type is inferred from the type of the typed array.
     * @param {number} index - index of texture uniform
     * @param {ArrayBufferView} arrays - image data from tile data ref: {@link LayerGl~createTile}
     */
    _bindTextureArrays( index, arrays ) {
        this._gl.activeTexture( this._gl.TEXTURE0 + index );
        this._gl.bindTexture( this._gl.TEXTURE_2D_ARRAY, this._textures[ index ] );
        this._gl.texParameteri( this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST );
        this._gl.texParameteri( this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST );

        this._gl.texImage3D(
            this._gl.TEXTURE_2D_ARRAY,
            0,
            this._gl.R32F,
            arrays.width,
            arrays.height,
            arrays.length,
            0,
            this._gl.RED,
            this._gl.FLOAT,
            Float32Array.from( arrays[ 0 ] ),
            0
        );

        this._gl.texParameteri( this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE );
        this._gl.texParameteri( this._gl.TEXTURE_2D_ARRAY, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE );
        // this._gl.generateMipmap( this._gl.TEXTURE_2D );
    },

    /**
     * createTile
     * @memberOf LayerGl~
     * @description
     * reference leaflet docs
     * @param {Object} coords - tile coordinates
     * @param {function} done - callback
     * @return {*} - tile
     */
    createTile( coords, done ) {
        const tile         = L.DomUtil.create( 'canvas', 'leaflet-tile' );
        tile.width         = tile.height = this.options.tileSize;
        tile.onselectstart = tile.onmousemove = L.Util.falseFn;

        const
            ctx          = tile.getContext( '2d' ),
            unwrappedKey = this._tileCoordsToKey( coords ),
            texFetches   = [];

        for ( let i = 0; i < this._tileLayers.length && i < 8; i++ ) {
            texFetches.push( this._getNthTile( i, coords ) );
        }

        Promise.all( texFetches )
            .then( ( textureImages ) => {
                if ( this._isReRenderable ) {
                    this._fetchedTextures[ unwrappedKey ] = textureImages;
                    this._2dContexts[ unwrappedKey ]      = ctx;
                }

                for ( let i = 0; i < this._tileLayers.length && i < 8; i++ ) {
                    this._bindTexture( i, textureImages[ i ] );
                }

                this._render( coords );
                ctx.drawImage( this._renderer, 0, 0 );
                done();
            } )
            .catch( ( err ) => {
                L.TileLayer.prototype._tileOnError.call( this, done, tile, err );
            } );

        return tile;
    },

    _removeTile( key ) {
        if ( this._isReRenderable ) {
            delete this._fetchedTextures[ key ];
            delete this._2dContexts[ key ];
        }

        L.TileLayer.prototype._removeTile.call( this, key );
    },

    onAdd() {
        // if the shader is time-dependent (i.e. animated), start an animation loop.
        if ( this._uNowPosition ) {
            L.Util.cancelAnimFrame( this._animFrame );
            this._animFrame = L.Util.requestAnimFrame( this._onFrame, this );
        }

        L.TileLayer.prototype.onAdd.call( this );
    },

    onRemove( map ) {
        // stop the animation loop, if any.
        L.Util.cancelAnimFrame( this._animFrame );
        L.TileLayer.prototype.onRemove.call( this, map );
    },

    _onFrame() {
        if ( this._uNowPosition && this._map ) {
            this.reRender();
            this._animFrame = L.Util.requestAnimFrame( this._onFrame, this, false );
        }
    },

    fastReRender() {
        this._gl.clear( this._gl.COLOR_BUFFER_BIT );
    },

    // runs shader again on all tiles
    reRender() {
        if ( !this._isReRenderable ) {
            return;
        }

        this._gl.uniform1f( this._uNowPosition, performance.now() );

        for ( const key in this._tiles ) {
            if ( !Object.prototype.hasOwnProperty.call( this._tiles, key ) ) {
                continue;
            }

            const
                tile       = this._tiles[ key ],
                coords     = this._keyToTileCoords( key ),
                wrappedKey = this._tileCoordsToKey( this._wrapCoords( coords ) );

            if ( !tile.current || !tile.loaded || !this._fetchedTextures[ wrappedKey ] ) {
                continue;
            }

            for ( let i = 0; i < this._tileLayers.length && i < 8; i++ ) {
                this._bindTexture( i, this._fetchedTextures[ wrappedKey ][ i ] );
            }

            this._render( coords );

            this._2dContexts[ key ].drawImage( this._renderer, 0, 0 );
        }
    },

    // sets value(s) for a uniform
    setUniform( name, value ) {
        // TODO: circle back to transferring boolean uniforms for edge detection and other boolean vertex shaders
        switch ( this._uniformSizes[ name ] ) {
            case 0:
                this._gl.uniform1f( this._uniformLocations[ name ], value );
                break;
            case 1:
                this._gl.uniform1fv( this._uniformLocations[ name ], value );
                break;
            case 2:
                this._gl.uniform2fv( this._uniformLocations[ name ], value );
                break;
            case 3:
                this._gl.uniform3fv( this._uniformLocations[ name ], value );
                break;
            case 4:
                this._gl.uniform4fv( this._uniformLocations[ name ], value );
                break;
        }
    },

    // gets the tile for the Nth `TileLayer` in `this._tileLayers`,
    // for the given tile coords, returns a promise to the tile.
    _getNthTile( n, coords ) {
        const layer = this._tileLayers[ n ];

        layer._tileZoom        = this._tileZoom;
        layer._map             = this._map;
        layer._crs             = this._map.options.crs;
        layer._globalTileRange = this._globalTileRange;

        return new Promise(
            ( res, rej ) => {
                const tile       = document.createElement( 'img' );
                tile.crossOrigin = '';
                tile.src         = layer.getTileUrl( coords );
                L.DomEvent.on( tile, 'load', res.bind( this, tile ) );
                L.DomEvent.on( tile, 'error', rej.bind( this, tile ) );
            }
        );
    }
} );

L.tileLayer.layerGl = function( opts ) {
    return new L.TileLayer.LayerGl( opts );
};
