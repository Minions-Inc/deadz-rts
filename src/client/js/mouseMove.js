var objNav = {};
var projector = new THREE.Projector();

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObject( objects.terrain, true );

	if ( intersects.length > 0 ) {

		console.log(intersects);

		//if(typeof(objNav[playerName]) !== "undefined") delete objNav[playerName];
		//setupNavData(level1NavData, 500, 500, function(a,b){runPathData(a,b,objects[playerName],{x:Math.floor(intersects[ 0 ].point.x),z:Math.floor(intersects[ 0 ].point.z)},objects.terrain,1,1,20,playerName)});
		socket.emit('clickPos',{x: intersects[0].point.x,z: intersects[0].point.z});

		//var particle = new THREE.Particle( particleMaterial );
		//particle.position = intersects[ 0 ].point;
		//particle.scale.x = particle.scale.y = 8;
		//scene.add( particle );

	}
}

document.addEventListener( 'mousedown', onDocumentMouseDown, false );