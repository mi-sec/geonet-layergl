# `layergl`

> See [geonet-layergl](https://github.com/mi-sec/geonet-layergl) for more info

## Usage

```
const layergl = require('@geonet/layergl');

L.tileLayer.layerGl( {
    uniforms: {
        u_brightness: +document.getElementById( 'u_brightness' ).value,
        u_contrast: +document.getElementById( 'u_contrast' ).value,
        u_rangeCenter: +document.getElementById( 'u_rangeCenter' ).value,
        u_rangeWidth: +document.getElementById( 'u_rangeWidth' ).value,
        u_sharpen: +document.getElementById( 'u_sharpen' ).value,
        u_sharpenRadius: +document.getElementById( 'u_sharpenRadius' ).value
    },
    vertexShader: <vertexShader>,
    fragmentShader: <fragmentShader>,
    tileLayers: {
        u_texture0: L.tileLayer.wms( ... )
    }
} )
    .addTo( this.map );
```
