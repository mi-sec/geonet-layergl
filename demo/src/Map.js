/** ****************************************************************************************************
 * File: Map.js
 * Project: boilerplate-leaflet-map
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 19-Feb-2019
 *******************************************************************************************************/
'use strict';

import L            from 'leaflet';
import LayerControl from './LayerControl';

import '../../packages/layergl';

import frag from './shader/main.frag';
import vert from './shader/main.vert';

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

		this.layerControl = new LayerControl( this.map, LayerControl.POSITION.TR );
	}

	init()
	{
		this.registerEvents();
		this.addBasemap();
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

		L.tileLayer.layerGl( {
			uniforms: {},
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
}

export default new Map();
