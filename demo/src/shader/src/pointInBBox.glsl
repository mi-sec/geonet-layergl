bool pointInBBox( vec2 p, vec4 bbox ) {
	bool pEofW = false;
	bool pWofE = false;
	bool pSofN = false;
	bool pNofS = false;

	if ( bbox.z < bbox.x ) {
		if ( p.x >= bbox.x ) {
			pEofW = pWofE = true;
		}
		if ( p.x <= bbox.z ) {
			pWofE = pEofW = true;
		}
	}
	else {
		if ( p.x >= bbox.x ) {
			pEofW = true;
		}
		if ( p.x <= bbox.z ) {
			pWofE = true;
		}
	}
	if ( p.y >= bbox.y ) {
		pNofS = true;
	}
	if ( p.y <= bbox.w ) {
		pSofN = true;
	}

	return pEofW && pWofE && pNofS && pSofN;
}

#pragma glslify: export(pointInBBox);
