var objects = {},
	objTypes = require('./objects.js'),
	navData = require('../client/js/navData.js'),
	PF = require('../lib/pathfinding'),
	objNav = {},
	zombies = {},
	requiredModels = ["HumanBase","zombie"];

function startSpawningZombies(io) {
	setInterval(function() {
		try {
			if(Object.keys(objects).length != 0) {
				//var objectToFollow = pickRandomProperty(objects); - REPLACE WITH .randProp() as actual object
				for (var i=0;i<25;i++) {
					var objToFollow = objects.randProp().Characters.randProp().randProp();
					if(objToFollow != undefined) break;
				}
				if (objToFollow == undefined) throw new Error("Failed to get a random object after 10 attempts!");
				var zombie = new objTypes.Zombie(objToFollow);
				zombie.pos = zombie.followedObject.pos.clone();
				//zombies["Zombie"+zombieID] = {name: "Zombie"+zombieID, model:"zombie", pos: objects[objectToFollow].pos.clone(), followedObj: objects[objectToFollow]};
				setupNavData(navData.level1NavData, 500, 500, function(a,b){zombiePath(a,b,zombie,zombie.followedObject,1,1,io)});
				zombies[zombie.name] = zombie;
			} else {
				console.log("Tried to spawn a zombie when no players had connected!");
			}
		} catch (e) {
			console.warn("FATAL ZOMBIE SPAWN ERROR: "+e.toString());
		}
	}, 5000);
}

Object.prototype.clone = function() {
    if (this == null) return this;
    var clonedObj = new Object();
    for (var attr in this) {
        if (this.hasOwnProperty(attr)) clonedObj[attr] = this[attr];
    }
    return clonedObj;
}

Object.prototype.randProp = function() {
	if (this == null) return this;
	return this[Object.keys(this)[Math.floor(Math.random() * Object.keys(this).length)]];
}

function newPlayer(socket, io) {
	console.log(socket.id+" sent newPlayer!");
	//objects[socket.id] = {name: data.name, model:data.model, pos:{x:250,y:11.7,z:250}, selected: false};
	//socket.emit("loadModels", requiredModels);
	objects[socket.id] = {
		Characters: {
			Minions: {},
			Commanders: {},
			Hero: {},
		},
		selectedObj: {name: "", type: ""}
	}
	var hero = new objTypes.Hero(socket.id);
	objects[socket.id].Characters.Hero[hero.name] = hero;
	var commander = new objTypes.Commander(socket.id);
	objects[socket.id].Characters.Commanders[commander.name] = commander;
	//new Date().getTime()
	//io.sockets.emit('newPlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos});
}

function clickPos(socket, io, data) {
	if(objects[socket.id].selectedObj.name != "")
		setupNavData(navData.level1NavData, 500, 500, function(a,b){runPathData(a,b,objects[socket.id].Characters[objects[socket.id].selectedObj.type][objects[socket.id].selectedObj.name],{x:Math.floor(data.x),z:Math.floor(data.z)},1,4,socket,io)});
}

function selectedObj(socket, io, data) {
	objects[socket.id].selectedObj = {name: "", type: ""};
	try {
		if(typeof(data.oldName) != "undefined")
			objects[socket.id].Characters[data.oldType][data.oldName].selected = false;
		if(typeof(data.name) != "undefined") {
			objects[socket.id].Characters[data.type][data.name].selected = true;
			objects[socket.id].selectedObj = {name: data.name, type: data.type};
		}
	} catch(e) {
		// Getting here probably means someone tried to click on a unit that wasn't theirs!
	}
}

function disconnected(socket, io) {
	/*for (var z in zombies) {
		if(zombies.hasOwnProperty(z) && zombies[z].followedObject.name == objects[socket.id].name) {
			delete zombies[z];
		}
	}*/
	delete objects[socket.id];
}

function setupNavData(navData, height, width, callback) {
    grid = new PF.Grid(width,height,c=navData);
    finder = new PF.AStarFinder({
        allowDiagonal:true,
        dontCrossCorners:true
    });
    callback && callback(grid, finder);
}

function runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, continued) {
	try {
	    if(!continued) {
	        if (typeof(objNav[object.navName]) !== "undefined") {
	            objNav[object.navName] = {
	                path: finder.findPath(object.pos.x,object.pos.z,targetPos.x,targetPos.z,grid.clone())
	            };
	            return;
	        } else {
	            objNav[object.navName] = {
	                path: finder.findPath(object.pos.x,object.pos.z,targetPos.x,targetPos.z,grid.clone())
	            };
	        }
	    }
	    if(object == undefined || typeof(object) !== "object") {
			delete objNav[object.navName];
			return;
		}
	    var steps = (objNav[object.navName].path.length>steps) ? steps : objNav[object.navName].path.length-1;
	    object.pos.x=objNav[object.navName].path[steps][0]*moveMult;
	    object.pos.z=objNav[object.navName].path[steps][1]*moveMult;
	    //io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
	    objNav[object.navName].path.shift();
	    if(objNav[object.navName].path.length<1) {
	        delete objNav[object.navName];
	    } else if(typeof(objNav[object.navName]) !== "undefined") {
	        setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, true);},100/object.speed);
	    }
    } catch (e) {
    		console.warn("FATAL ERROR: "+e.toString());
    		delete objNav[object.navName];
	}
}

function zombiePath(grid, finder, object, targetObj, moveMult, steps, io) {
	try {
		if(object == undefined || typeof(object) !== "object" || object.timeToLive-- < 1) {
			delete objNav[object.navName];
			delete zombies[object.name];
			return;
		}
	    objNav[object.navName] = {path: finder.findPath(object.pos.x,object.pos.z,targetObj.pos.x,targetObj.pos.z,grid.clone())};
	    //var steps = (objNav[object.navName].path.length>steps) ? steps : objNav[object.navName].path.length-1;
	    //steps = (steps < 0) ? steps : 0;
	    step = (objNav[object.navName].path.length > 1) ? steps : 0;
    	object.pos.x=objNav[object.navName].path[step][0]*moveMult;
    	object.pos.z=objNav[object.navName].path[step][1]*moveMult;
	    //io.sockets.emit('movePlayer', {name: object.name, model: object.model, pos: object.pos})
	    objNav[object.navName].path.shift();
	    //if(typeof(objNav[object.navName]) !== "undefined") {
    	setTimeout(function() {zombiePath(grid, finder, object, targetObj, moveMult, steps, io);},100/object.speed);
	    //}
    } catch (e) {
		console.warn("FATAL ERROR: "+e.toString());
		delete objNav[object.navName];
		delete zombies[object.name];
	}
}

module.exports = {
	objects: objects,
	startSpawningZombies: startSpawningZombies,
	zombies: zombies,
	newPlayer: newPlayer,
	selectedObj: selectedObj,
	clickPos: clickPos,
	disconnected: disconnected,
	requiredModels: requiredModels
};