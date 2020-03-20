# geonet-layergl

@geonet/layergl - WebGL for Leaflet Layers

### [Demo](./demo/)

Leaflet Layers with low-level WebGL shaders


**Currently imagery adjustment suite support**:

- `brightness` (basic rgb color model adjustment)
- `contrast` (michelson contrast algorithm)
- `sharpen` (hysteresis thresholding and the laplace operator - laplacian kernel algorithm)
    - tested the following algorithms and had poor results:
        - Sobel
        - Roberts
        - Laplacian of Gaussian
        - Robinson Compass
        - Zero-cross mask sharpening
        - Canny mask sharpening
        - gabor unmask sharpening
        - various multi-pass unmask sharpening methods
- `night vision` (a mistake made when modifying the laplacian filter kernel, significantly brightens dark areas and
slightly sharpens areas of high luminance contrast, resulting in a night-vision-like brightness and edge emphasis)

**Experimental support**:

- `dynamic range adjustment` (work in progress - at the moment it only applies gamma correction and is **not** adaptive
or dynamic)
- `edge detection` (prewitt operator algorithm - can eventually be used for automated image-to-geometry edge detection
and tagging)

**Dream support**:

one day, mapping data via WebGL could result in:
- `rotation` (highly experimental and barely underway - map rotation support in Leaflet)
- `line-of-sight` ("viewshed" or "line-of-sight" computing when served SRTM or other elevation based data)
- other elevation data computations can be made **on the fly** with this module 


**Contribution**:

This module is based on Ivan Sanchez's `Leaflet.TileLayer.GL` repo that appears to no longer be maintained.
