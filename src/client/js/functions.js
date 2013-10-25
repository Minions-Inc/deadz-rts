var size = 0;
var objects = {};
var modelCache = new MicroCache();
var camera, scene, loader, pointLight, renderer;
var mouseX = 0, mouseY = 0, mouseXDelta = 0, mouseYDelta = 0, mouseScale = 0.04, mouseDelta = 10;
var windowHalfX, windowHalfY;
var tps = 60, fpsLimit = 30;
var isPlaying, gameStarted = false;
var cameraMin = 10, cameraMax = 135;
var lastTickTime = new Date().getTime();

function addObj(name, loc, callback) {
	if(objects[name] == null) {
		if(!modelCache.contains(loc)) {
			loader.load(loc, function(geometry, mats) {
				modelCache.set(loc, {geometry:geometry, mats:mats});
				var mats = [];
				for (var i=0;i<modelCache.get(loc).mats.length;i++)
					mats.push(modelCache.get(loc).mats[i].clone());
				objects[name] = new THREE.Mesh(modelCache.get(loc).geometry, new THREE.MeshFaceMaterial(mats));
				objects[name].name = name;
				//objects[name] = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(mats));
				//objects[name] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
				//objects[name] = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({wireframe:false}));
				size++;
				scene.add(objects[name]);
				//objects[name].position = pos;
				// var pos = 0.5;
				// for(var obj in objects) {
				// 	objects[obj].position.x = (pos-(size/2))*2
				// 	pos++;
				// }
				if (typeof callback === "function")
					callback(objects[name]);
			});
		} else {
			var mats = [];
			for (var i=0;i<modelCache.get(loc).mats.length;i++)
				mats.push(modelCache.get(loc).mats[i].clone());
			objects[name] = new THREE.Mesh(modelCache.get(loc).geometry, new THREE.MeshFaceMaterial(mats));
			objects[name].name = name;
			size++;
			scene.add(objects[name]);
			if (typeof callback === "function")
				callback(objects[name]);
		}
	} else {
		console.error("ERROR: Object with name "+name+" already exists!");
	}
}

function addSkinnedObj(name, loc) {
	if(objects[name] == null) {
		loader.load(loc, function(geometry, mats) {
			objects[name] = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(mats));
			//objects[name] = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
			//objects[name] = new THREE.SkinnedMesh(geometry, new THREE.MeshNormalMaterial());
			size++;
			// var pos = 0.5;
			// for(var obj in objects) {
			// 	objects[obj].position.x = (pos-(size/2))*2
			// 	pos++;
			// }
			scene.add(objects[name]);
		});
	} else {
		console.error("ERROR: Object with name "+name+" already exists!");
	}
}

function remObj (name) {
	if(objects[name] != null) {
		scene.remove(objects[name]);
		delete objects[name];
		size--;
		/*
		var pos = 0.5;
		for(var obj in objects) {
			objects[obj].position.x = (pos-(size/2))*2
			pos++;
		}
		*/
	} else {
		console.error("ERROR: Object with name "+name+" doesn't exist!");
	}
}

function addCube(name, position) {
	if(objects[name] == null) {
		objects[name] = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
		size++;
		scene.add(objects[name]);
		objects[name].position = position;
		/*
		var pos = 0.5;
		for(var obj in objects) {
			objects[obj].position.x = (pos-(size/2))*2
			pos++;
		}
		*/
	} else {
		console.error("ERROR: Object with name "+name+" already exists!");
	}
}

function addSphere(name) {
	if(objects[name] == null) {
		objects[name] = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshNormalMaterial());
		size++;
		scene.add(objects[name]);
		var pos = 0.5;
		for(var obj in objects) {
			objects[obj].position.x = (pos-(size/2))*2
			pos++;
		}
	} else {
		console.error("ERROR: Object with name "+name+" already exists!");
	}
}

function render() {
	setTimeout(function() {
		requestAnimationFrame(render);
	}, 1000/fpsLimit);
	if(!document.webkitHidden) renderer.render(scene, camera);
}

function gameUpdate() {
	setTimeout(function() {
		gameUpdate();
	}, 1000/tps); // Ticks Per Second

	var tickLength = new Date().getTime() - lastTickTime;
	lastTickTime = new Date().getTime();

	//var rotationMatrix = new THREE.Matrix4();
	//var position = new THREE.Vector3(1, 1, 1);
	//var angle = 0*(Math.PI / 180);
	var axis = new THREE.Vector3(scrollingHoriz, 0, scrollingVert);
	axis.applyQuaternion(camera.quaternion);
	axis.y = 0;
	axis.normalize();
	//rotationMatrix.makeRotationAxis(axis, angle).multiplyVector3(position);

	/*if(scrollingHoriz == 1) {
		camera.position.x -= axis.x*mouseEdgeSpeed;
		camera.position.z += axis.z*mouseEdgeSpeed;
	}
	else if(scrollingHoriz == 2) {
		camera.position.x += axis.x*mouseEdgeSpeed;
		camera.position.z -= axis.z*mouseEdgeSpeed;
	}
	if(scrollingVert == 1) {
		camera.position.z -= axis.z*mouseEdgeSpeed;
		camera.position.x -= axis.x*mouseEdgeSpeed;
	}
	else if(scrollingVert == 2) {
		camera.position.z += axis.z*mouseEdgeSpeed;
		camera.position.x += axis.x*mouseEdgeSpeed;
	}*/
	camera.position.x += axis.x*mouseEdgeSpeed*tickLength/20;
	camera.position.z += axis.z*mouseEdgeSpeed*tickLength/20;
	if(camera.position.x < cameraMin) camera.position.x=cameraMin;
	if(camera.position.x > cameraMax) camera.position.x=cameraMax;
	if(camera.position.z < cameraMin) camera.position.z=cameraMin;
	if(camera.position.z > cameraMax) camera.position.z=cameraMax;

	for(var i in objects) {
		if(objects.hasOwnProperty(i) && objects[i].targetPosition) {
			var moveAxis = new THREE.Vector3();
			moveAxis.subVectors(objects[i].targetPosition, objects[i].position);
			moveAxis.y = 0;
			moveAxis.normalize();
			if(objects[i].position.distanceTo(objects[i].targetPosition) < (objects[i].speed*10)/tickLength)
				objects[i].position = objects[i].targetPosition.clone();
			else
				objects[i].position.add(moveAxis.multiplyScalar((objects[i].speed*10)/tickLength));
		}
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	
	//controls.handleResize();
	
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
}

camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, .1, 10000 );
camera.position.z = 25;
scene = new THREE.Scene();
loader = new THREE.JSONLoader();
pointLight = new THREE.DirectionalLight(0xFCFFE5,3);
//pointLight.rotation.x=45;
pointLight.position=new THREE.Vector3(125,75,125);
scene.add(pointLight);
renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
render();
windowHalfX = window.innerWidth / 2;
windowHalfY = window.innerHeight / 2;
//document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'resize', onWindowResize, false );

camera.position=new THREE.Vector3(70,15,18);