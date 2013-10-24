var mouseEdgeSize = 50;
var mouseEdgeSpeed = 0.25;
var scrollingVert = 0;
var scrollingHoriz = 0;
var zoomSpeed = 1;

function onDocumentMouseMove(e) {
	if (e.clientX < mouseEdgeSize || e.clientX > window.innerWidth-mouseEdgeSize || e.clientY < mouseEdgeSize || e.clientY > window.innerHeight-mouseEdgeSize) {
		if(e.clientX < mouseEdgeSize)
			scrollingHoriz = -1;
		else if(e.clientX > window.innerWidth-mouseEdgeSize)
			scrollingHoriz = 1;
		else
			scrollingHoriz = 0;
		if(e.clientY < mouseEdgeSize)
			scrollingVert = -1;
		else if (e.clientY > window.innerHeight-mouseEdgeSize)
			scrollingVert = 1;
		else
			scrollingVert = 0;
		//console.log('Mouse at edge!');
	} else {
		scrollingHoriz = 0;
		scrollingVert = 0;
	}
}

function onMouseScroll(e) {
	if(e.wheelDeltaY < 0) {
		e.preventDefault();
		camera.position.y += zoomSpeed;
	} else if(e.wheelDeltaY > 0) {
		e.preventDefault();
		camera.position.y -= zoomSpeed;
	}
}

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'mousewheel', onMouseScroll, false );
window.addEventListener( 'DOMMouseScroll', onMouseScroll, false );