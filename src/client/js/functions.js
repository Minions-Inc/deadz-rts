var size = 0;
var objects = {};
var modelCache = new MicroCache();
var camera, scene, loader, pointLight, renderer;
var mouseX = 0, mouseY = 0, mouseXDelta = 0, mouseYDelta = 0, mouseScale = 0.04, mouseDelta = 10;
var windowHalfX, windowHalfY;

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
	requestAnimationFrame(render);
	if(scrollingHoriz == 1) {
		camera.position.x -= mouseEdgeSpeed
		camera.position.z += camera.rotation.z*mouseEdgeSpeed;
	}
	else if(scrollingHoriz == 2) {
		camera.position.x += mouseEdgeSpeed;
		camera.position.z -= camera.rotation.z*mouseEdgeSpeed;
	}
	if(scrollingVert == 1) {
		camera.position.z -= mouseEdgeSpeed;
		camera.position.x -= camera.rotation.y*mouseEdgeSpeed;
	}
	else if(scrollingVert == 2) {
		camera.position.z += mouseEdgeSpeed;
		camera.position.x += camera.rotation.y*mouseEdgeSpeed;
	}
	if(camera.position.x < 50) camera.position.x=50;
	if(camera.position.x > 500) camera.position.x=500;
	if(camera.position.z < 50) camera.position.z=50;
	if(camera.position.z > 500) camera.position.z=500;
	renderer.render(scene, camera);
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

addObj("terrain","level1.js",function(a){
	a.scale.x=7.75;
	a.scale.y=7.75;
	a.scale.z=7.75;
	a.position.x=2;
	a.position.z=-10;
});
camera.position=new THREE.Vector3(280,50,65)
camera.rotation.x=-1;
camera.rotation.y=0.2;
camera.rotation.z=0.2;

new THREE.Vector3(280,50,65)