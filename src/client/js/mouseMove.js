var objNav = {};
var projector = new THREE.Projector();
var selectedObj;

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

	if(event.button == 2) {

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
	} else if(event.button == 0) {
		var objsToFind = [];
		var oldObj = selectedObj;
		for(var i in objects)
			if(objects.hasOwnProperty(i) && objects[i].objectType > 0 && objects[i].objectType < 4 && objects[i].owner == isPlaying)
				objsToFind.push(objects[i]);
		var intersects = raycaster.intersectObjects(objsToFind, false);
		if(intersects.length > 0) {
			console.log(intersects);
			//if(selectedObj != undefined) selectedObj.material.materials[0].color.b = 0;
			selectedObj = intersects[0].object;
			//selectedObj.material.materials[0].color.b = 0.4;
			//var type = selectedObj.name.match(/^(Hero|Commander|Minion)/)[0];
			var type = selectedObj.objectType;
			type = type == 1 ? "Minions" : type == 2 ? "Commanders" : "Hero";
			if(oldObj != null) {
				var oldType = oldObj.objectType;
				oldType = oldType == 1 ? "Minions" : oldType == 2 ? "Commanders" : "Hero";
				socket.emit('selectedObj',{name: selectedObj.name, type: type, oldName: oldObj.name, oldType: oldType});
			} else {
				socket.emit('selectedObj',{name: selectedObj.name, type: type});
			}
		} else {
			//if(selectedObj != undefined) selectedObj.material.materials[0].color.b = 0;
			selectedObj = undefined;
			if(oldObj != null) {
				var oldType = oldObj.objectType;
				oldType = oldType == 1 ? "Minions" : oldType == 2 ? "Commanders" : "Hero";
				socket.emit('selectedObj',{oldName: oldObj.name, oldType: oldType});
			}
		}
	}
	return false;
}
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'contextmenu', function(e){e.preventDefault();return false;}, false );