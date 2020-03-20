/** ****************************************************************************************************
 * File: Map.js
 * Project: boilerplate-leaflet-map
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 19-Feb-2019
 *******************************************************************************************************/
'use strict';

import L            from 'leaflet';
import LayerControl from './LayerControl';

import '../../packages/layergl';

import frag from './shader/general.frag';
import vert from './shader/general.vert';

class Map
{
    constructor()
    {
        this.map = L.map( 'map', {
            renderer: L.svg(),
            minZoom: 0,
            maxZoom: 25
        } );

        this.map.setView( [
            33.63791754316666, -84.43722620140763
        ], 20 );
    }

    init()
    {
        this.registerEvents();
        this.addBasemap();

        this.bindUniforms( 'u_brightness', 'u_brightness', 'change input' );
        this.bindUniforms( 'u_contrast', 'u_contrast', 'change input' );
        this.bindUniforms( 'u_rangeCenter', 'u_rangeCenter', 'change input' );
        this.bindUniforms( 'u_rangeWidth', 'u_rangeWidth', 'change input' );
        this.bindUniforms( 'u_sharpen', 'u_sharpen', 'change input' );
        this.bindUniforms( 'u_sharpenRadius', 'u_sharpenRadius', 'change input' );
    }

    registerEvents()
    {
        this.map.on( 'click', e => {
            const latlng = this.map.mouseEventToLatLng( e.originalEvent );
            console.log( `Lat: ${ latlng.lat }\nLng: ${ latlng.lng }` );
        } );
    }

    addBasemap()
    {
        this.$shaders = {
            main: { frag, vert }
        };

        this.$layerGl = L.tileLayer.layerGl( {
            uniforms: {
                u_brightness: +document.getElementById( 'u_brightness' ).value,
                u_contrast: +document.getElementById( 'u_contrast' ).value,
                u_rangeCenter: +document.getElementById( 'u_rangeCenter' ).value,
                u_rangeWidth: +document.getElementById( 'u_rangeWidth' ).value,
                u_sharpen: +document.getElementById( 'u_sharpen' ).value,
                u_sharpenRadius: +document.getElementById( 'u_sharpenRadius' ).value
            },
            vertexShader: this.$shaders.main.vert,
            fragmentShader: this.$shaders.main.frag,

            tileLayers: {
                u_texture0: L.tileLayer.wms( 'https://omar.ossim.io/omar-wms/wms', {
                    layers: 'omar:raster_entry',
                    filter: 'image_id like \'058174419010_01_assembly\'',
                    srs: 'EPSG:3857',
                    styles: JSON.stringify( {
                        bands: 'default',
                        brightness: 0,
                        contrast: 1,
                        hist_center: false,
                        hist_op: 'none',
                        nullPixelFlip: true,
                        resampler_filter: 'bilinear',
                        sharpen_mode: 'none'
                    } ),
                    transparent: true
                } )
            }
        } )
            .addTo( this.map );
    }

    bindUniforms( key, id, evt )
    {
        L.DomEvent.on( document.getElementById( id ), evt, ( e ) => {
            this.$layerGl.setUniform( key, e.target.value );
            this.$layerGl.reRender();
        } );
    }
}

export default new Map();
