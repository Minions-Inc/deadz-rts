var objects = {},
	navData = require('./client/js/navData.js'),
	PF = require('pathfinding'),
	objNav = {},
	zombies = {},
	zombieID = 0;

function startSpawningZombies(io) {
	setInterval(function() {
		try {
			if(objects.length !== 0) {
				zombieID++;
				var objectToFollow = pickRandomProperty(objects);
				zombies["Zombie"+zombieID] = {name: "Zombie"+zombieID, model:"zombie", pos: objects[objectToFollow].pos, followedObj: objects[objectToFollow]};
				setupNavData(navData.level1NavData, 500, 500, function(a,b){zombiePath(a,b,zombies["Zombie"+zombieID],objects[objectToFollow],1,1,2500,"Zombie"+zombieID+"Nav",io)});
			} else {
				console.log("Tried to spawn a zombie when none existed!");
			}
		} catch (e) {
			console.warn("FATAL ERROR: "+e.toString());
		}

	}, 30000);
}

function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

function newPlayer(socket, io, data) {
	console.log(socket.id+" sent via newPlayer:");
	console.log(data);
	objects[socket.id] = {name: data.name, model:data.model, pos:{x:250,y:0,z:250}};
	io.sockets.emit('newPlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos});
}

function sendPlayers(socket, io, data) {
	for(var i in objects) if(i != socket.id) socket.emit('newPlayer', {name: objects[i].name, model: data.model, pos: objects[i].pos});
}

function movePlayer(socket, io, data) {
	objects[socket.id].pos.x += (data.dir==0) ? 0.1 : (data.dir==1) ? -0.1 : 0;
	objects[socket.id].pos.z += (data.dir==2) ? 0.1 : (data.dir==3) ? -0.1 : 0;
	io.sockets.emit('movePlayer', {name: objects[socket.id].name, model:objects[socket.id].model, pos: objects[socket.id].pos});
}

function clickPos(socket, io, data) {
	setupNavData(navData.level1NavData, 500, 500, function(a,b){runPathData(a,b,objects[socket.id],{x:Math.floor(data.x),z:Math.floor(data.z)},1,1,20,socket.id,socket,io)});
}

function disconnected(socket, io) {
	io.sockets.emit('removePlayer', {name: objects[socket.id].name});
	for (var z in zombies) {
		if(zombies[z].followedObj.name == objects[socket.id].name) {
			io.sockets.emit('removePlayer', {name: zombies[z].name});
			delete zombies[z];
		}
	}
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

function runPathData(grid, finder, object, targetPos, moveMult, steps, speed, navName, socket, io, continued) {
	try {
	    if(!continued) {
	        if (typeof(objNav[navName]) !== "undefined") {
	            objNav[navName] = {
	                path: finder.findPath(object.pos.x,object.pos.z,targetPos.x,targetPos.z,grid)
	            };
	            return;
	        } else {
	            objNav[navName] = {
	                path: finder.findPath(object.pos.x,object.pos.z,targetPos.x,targetPos.z,grid)
	            };
	        }
	    }
	    var steps = (objNav[navName].path.length>steps) ? steps : objNav[navName].path.length-1;
	    object.pos.x=objNav[navName].path[steps][0]*moveMult;
	    object.pos.z=objNav[navName].path[steps][1]*moveMult;
	    io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
	    objNav[navName].path.shift();
	    if(objNav[navName].path.length<1) {
	        delete objNav[navName];
	    } else if(typeof(objNav[navName]) !== "undefined") {
	        setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, speed, navName, socket, io, true);},speed);
	    }
    } catch (e) {
    		console.warn("FATAL ERROR: "+e.toString());
    		delete objNav[navName];
	}
}

function zombiePath(grid, finder, object, targetObj, moveMult, steps, speed, navName, io) {
	try {
	    objNav[navName] = {path: finder.findPath(object.pos.x,object.pos.z,targetObj.pos.x,targetObj.pos.z,grid.clone())};
	    //var steps = (objNav[navName].path.length>steps) ? steps : objNav[navName].path.length-1;
	    //steps = (steps < 0) ? steps : 0;
	    step = (objNav[navName].path.length > 1) ? steps : 0;
    	object.pos.x=objNav[navName].path[step][0]*moveMult;
    	object.pos.z=objNav[navName].path[step][1]*moveMult;
	    io.sockets.emit('movePlayer', {name: object.name, model: object.model, pos: object.pos})
	    objNav[navName].path.shift();
	    //if(typeof(objNav[navName]) !== "undefined") {
    	setTimeout(function() {zombiePath(grid, finder, object, targetObj, moveMult, steps, speed, navName, io);},speed);
	    //}
    } catch (e) {
		console.warn("FATAL ERROR: "+e.toString());
		delete objNav[navName];
	}
}

module.exports = {
	objects: objects,
	startSpawningZombies: startSpawningZombies,
	newPlayer: newPlayer,
	movePlayer: movePlayer,
	clickPos: clickPos,
	sendPlayers: sendPlayers,
	disconnected: disconnected
};