var playerName = "";
socket.on('connect', function() {
	if(playerName == "")playerName = "Player "+Math.floor(Math.random()*100);
	socket.emit('newPlayer', {name:playerName, model:"HumanBase"});
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyDown, false );
});
socket.on('loadModels', function(models) {
	console.log(models);
	loadModel(models, 0);
});
function loadModel(models, i) {
	loader.load(models[i]+".js", function(geometry, mats) {
		modelCache.set(models[i], {geometry: geometry, mats:mats});
		if(i==models.length-1)
			setupNetwork();
		else
			loadModel(models, i+1);
	});
}
function setupNetwork() {
	socket.on('newPlayer', function(data) {
		addPlayer(data.name, data.model, data.pos);
	});
	socket.on('movePlayer', function(data) {
		if(objects[data.name] == null)
			addPlayer(data.name, data.model, data.pos);
		else
			objects[data.name].position = new THREE.Vector3(data.pos.x,data.pos.y,data.pos.z); if(new THREE.Raycaster(new THREE.Vector3(objects[data.name].position.x,1000,objects[data.name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain).length != 0) objects[data.name].position.y = 1000-new THREE.Raycaster(new THREE.Vector3(objects[data.name].position.x,1000,objects[data.name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
		//console.log(objects[data.name])
		//if(new THREE.Raycaster(new THREE.Vector3(objects[data.name].position.x,1000,objects[data.name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain).length != 0)
	    //    objects[data.name].position.y = 1000-new THREE.Raycaster(new THREE.Vector3(objects[data.name].position.x,1000,objects[data.name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
	});
	socket.on('removePlayer', function(data) {
		remObj(data.name);
	});
	socket.on('updateObjects', function(data) {
		console.log("Recieved updateObjects!");
		console.log(data);
		for(var i in data) {
			if(objects.hasOwnProperty(data[i].name)) {
				//objects[data[i].name].position = new THREE.Vector3(data[i].pos.x,data[i].pos.y,data[i].pos.z); if(new THREE.Raycaster(new THREE.Vector3(objects[data[i].name].position.x,1000,objects[data[i].name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain).length != 0) objects[data[i].name].position.y = 1000-new THREE.Raycaster(new THREE.Vector3(objects[data[i].name].position.x,1000,objects[data[i].name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
				objects[data[i].name].position = new THREE.Vector3(data[i].pos.x,data[i].pos.y,data[i].pos.z);
				console.log("Moved "+data[i].name);
			} else {
				addPlayer(data[i].name, data[i].model, data[i].pos);
				console.log("Added "+data[i].name);
			}
		}
		var currObjs = new Object();
	    for (var attr in objects) {
	        if (objects.hasOwnProperty(attr)) currObjs[attr] = objects[attr];
	    }
		delete currObjs.terrain;
		for(var i in data) {
			if(currObjs.hasOwnProperty(data[i].name))
				delete currObjs[data[i].name];
		}
		for(var i in currObjs) {
			remObj(i);
			console.log("Removed "+i);
		}
		//setInterval(function(){objects[playerName].position.x+=10}, 1000)
		console.log(currObjs);
	});
	socket.emit('loadedModels', {name:playerName, model:"HumanBase"});
}

function addPlayer(name, model, pos) {
	//addCube(name, position);
	addObj(name, model+".js", function(object) {
		//object.position = new THREE.Vector3(pos.x,pos.y,pos.z);
		//object.scale.x=25;
		//object.scale.y=25;
		//object.scale.z=25;
		//object.material = new THREE.MeshNormalMaterial();
		object.position = new THREE.Vector3(pos.x,pos.y,pos.z);
		//object.position.y = 1000-new THREE.Raycaster(new THREE.Vector3(object.position.x,1000,object.position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
		//console.log(objects[data.name])
	});
}

/*
var originPoint = PLAYER.position.clone();
for (var vertexIndex = 0; vertexIndex < PLAYER.geometry.vertices.length; vertexIndex++) {
	var localVertex = PLAYER.geometry.vertices[vertexIndex].clone();
	var globalVertex = PLAYER.matrix.multiplyVector3(localVertex);
	var directionVector = globalVertex.subSelf(PLAYER.position); // RAY Casting Function
	var ray = new THREE.Ray(PLAYER.position, directionVector.clone().normalize());
	var collisionResults = ray.intersectObjects(ArrayOfCollideableObjects);
	if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
		
	}
}
*/

function checkCollision(obj, colObjects) {
	//objects["Player 65"].geometry.vertices
	for(var i in obj.geometry.verticies) {
		colDetect.addRay(obj.geometry.vertices[i]);
	}
	for(var i in colObjects) {
		colDetect.addElement(colObjects[i]);
	}
}

function CollisionDetection(){
    var caster = new THREE.Raycaster();
    var rays = [];
    var elements = [];

    this.testElement = function(element){
        for(var i=0; i<rays.length; i++) {
            caster.set(element.position, rays[i]);
            var hits = caster.intersectObjects(elements, true);
            for(var k=0; k<hits.length; k++) {
                console.log("hit", hits[k]);
            }
        }
    } 
    this.addRay = function(ray) {
        rays.push(ray.normalize());
    }
    this.addElement = function(element){
        elements.push(element);
    }
}

function onKeyDown(event) {
	if(event.type==='keydown') {
		//console.log(event.keyCode);
		/*
		37 = left
		38 = up
		39 = right
		40 = down
		87 = w
		83 = s
		65 = a
		68 = d
		81 = q
		90 = z
		32 = space
		16 = shift
		17 = ctrl
		*/
		switch (event.keyCode) {
			case 38:
				console.log('up');
				break;
			case 87:
				console.log('w');
				objects[playerName].position.y += 0.1;
				if(socket.socket.connected)socket.emit('movePlayer', {dir:2});
				break;
			case 40:
				console.log('down');
				break;
			case 83:
				console.log('s');
				objects[playerName].position.y -= 0.1;
				if(socket.socket.connected)socket.emit('movePlayer', {dir:3});
				break;
			case 37:
				console.log('left');
				break;
			case 65:
				console.log('a');
				objects[playerName].position.x -= 0.1;
				if(socket.socket.connected)socket.emit('movePlayer', {dir:1});
				break;
			case 39:
				console.log('right');
				break;
			case 68:
				console.log('d');
				objects[playerName].position.x += 0.1;
				if(socket.socket.connected)socket.emit('movePlayer', {dir:0});
				break;
			case 32:
				console.log('jump');
				break;
			case 81:
				console.log('up');
				break;
			case 16:
				console.log('sprint');
				break;
			case 17:
				console.log('crouch');
				break;
			case 90:
				console.log('down');
				break;
			case 74:
				console.log('j');
				var cHeight = prompt('Camera height?',camera.position.y);
				//cHeight = isNaN(parseFloat(cHeight)) ? camera.position.y : parseFloat(cHeight);
				camera.position.y = isNaN(parseFloat(cHeight)) ? camera.position.y : parseFloat(cHeight);;
				break;
			default:
				console.log('unknown key ('+event.keyCode+')');
				console.log();
				break;
		}
	} else if(event.type==='keyup') {
		
	}
}