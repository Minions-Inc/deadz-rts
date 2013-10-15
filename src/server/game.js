var objects = {},
	objTypes = require('./objects.js'),
	navData = require('../client/js/navDataSmall.js'),
	PF = require('../lib/pathfinding'),
	objNav = {},
	zombies = {},
	EventEmitter = require('events').EventEmitter,
	events = new EventEmitter(),
	requiredModels = ["HumanBase","zombie"],
	zombieSpawn = [
		{x:64,y:3,z:64},
		{x:16,y:3,z:64},
		{x:64,y:3,z:16}
	],
	playerSpawn = [
		{x:66,y:3,z:8},
		{x:66,y:3,z:118}
	],
	moveTimers = {},
	timerCount = 0;

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
				//zombie.pos = zombie.followedObject.pos.clone();
				zombie.pos = zombieSpawn[Math.floor(Math.random()*zombieSpawn.length)];
				zombie.targetPos = zombie.followedObject.pos;
				//zombies["Zombie"+zombieID] = {name: "Zombie"+zombieID, model:"zombie", pos: objects[objectToFollow].pos.clone(), followedObj: objects[objectToFollow]};
				//setupNavData(navData.level1NavData, 128, 128, function(a,b){zombiePath(a,b,zombie,zombie.followedObject,1,1,io)});
				zombies[zombie.name] = zombie;
				startZombieMoveTimer(zombie.name);
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
};

Object.prototype.randProp = function() {
	if (this == null) return this;
	return this[Object.keys(this)[Math.floor(Math.random() * Object.keys(this).length)]];
};

Object.prototype.length = function() {
	if (this == null) return this;
	var thisLength = 0;
	for(key in this) {
		if(this.hasOwnProperty(key)) thisLength++;
	}
	return thisLength;
};

function newPlayer(socket, io) {
	console.log(socket.id+" sent newPlayer!");
	if(objects.length() > 1) {
		//socket.emit('alert', "There are already 2 players, so you may only spectate!");
		socket.emit('isPlaying', 0);
		return;
	}
	socket.emit('isPlaying', objects.length()+1);
	//objects[socket.id] = {name: data.name, model:data.model, pos:{x:250,y:11.7,z:250}, selected: false};
	//socket.emit("loadModels", requiredModels);
	objects[socket.id] = {
		PlayerID: objects.length(),
		Characters: {
			Minions: {},
			Commanders: {},
			Hero: {},
		},
		buildings: {},
		inventory: {food: 100, building: 100},
		selectedObj: {name: "", type: ""}
	};
	var hero = new objTypes.Hero(socket.id);
	hero.pos = playerSpawn[objects[socket.id].PlayerID].clone();
	hero.targetPos = playerSpawn[objects[socket.id].PlayerID].clone();
	objects[socket.id].Characters.Hero[hero.name] = hero;
	startMoveTimer(socket.id, "Hero", hero.name);
	var commander = new objTypes.Commander(socket.id);
	commander.pos = playerSpawn[objects[socket.id].PlayerID].clone();
	commander.targetPos = playerSpawn[objects[socket.id].PlayerID].clone();
	objects[socket.id].Characters.Commanders[commander.name] = commander;
	startMoveTimer(socket.id, "Commanders", commander.name);
	if(objects.length() == 2)
		events.emit('startGame');
	//new Date().getTime()
	//io.sockets.emit('newPlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos});
}

function clickPos(socket, io, data) {
	console.log(data);
	try {
		if(objects[socket.id].selectedObj.name != "") {
			var selectedObj = objects[socket.id].Characters[objects[socket.id].selectedObj.type][objects[socket.id].selectedObj.name];
			selectedObj.targetPos = {x: Math.floor(data.x), z: Math.floor(data.z)};
			console.log(objects[socket.id].selectedObj.targetPos);
			//setupNavData(navData.level1NavData, 128, 128, function(a,b){runPathData(a,b,objects[socket.id].Characters[objects[socket.id].selectedObj.type][objects[socket.id].selectedObj.name],{x:Math.floor(data.x),z:Math.floor(data.z)},1,4,socket,io)});
			events.emit('cluster', {cmd: 'setupNavData', params: {object: selectedObj, objectType: objects[socket.id].selectedObj.type}});
		}
	} catch(e) {
		console.warn("FATAL CLICKPOS ERROR: "+e.toString());
	}
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

function startMoveTimer(socketid, objType, objName) {
	var object = objects[socketid].Characters[objType][objName];
	var timerID = timerCount++;
	object.moveTimer = timerID;
	moveTimers[timerID] = setInterval(function() {
		moveTimer(object, timerID, objType);
	}, 100/object.speed);
}

function startZombieMoveTimer(objName) {
	var object = zombies[objName];
	var timerID = timerCount++;
	object.moveTimer = timerID;
	moveTimers[timerID] = setInterval(function() {
		zombieMoveTimer(object, timerID);
	}, 100/object.speed);
}

function stopMoveTimer(timerID) {
	clearInterval(moveTimers[timerID]);
	delete moveTimers[timerID];
}

function moveTimer(object, timerID, objType) {
	if(typeof(object) == "undefined") {
		stopMoveTimer(moveTimers[timerID]);
		return;
	}
	events.emit('cluster', {
		cmd: 'runPathData', params: {
			object: object,
			objType: objType
		}
	});
}

function zombieMoveTimer(object, timerID) {
	if(typeof(object) == "undefined") {
		stopMoveTimer(moveTimers[timerID]);
		return;
	}
	object.targetPos = object.followedObject.pos;
	events.emit('cluster', {
		cmd: 'runZombiePathData', params: {
			object: object
		}
	});
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
			setTimeout(function() {runPathData(grid, finder, object, targetPos, moveMult, steps, socket, io, true);},25/object.speed);
		}
	} catch (e) {
			console.warn("FATAL ERROR: "+e.toString());
			if(object.navName != undefined) delete objNav[object.navName];
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
		var step = (objNav[object.navName].path.length > 1) ? steps : 0;
		object.pos.x=objNav[object.navName].path[step][0]*moveMult;
		object.pos.z=objNav[object.navName].path[step][1]*moveMult;
		//io.sockets.emit('movePlayer', {name: object.name, model: object.model, pos: object.pos})
		objNav[object.navName].path.shift();
		//if(typeof(objNav[object.navName]) !== "undefined") {
		setTimeout(function() {zombiePath(grid, finder, object, targetObj, moveMult, steps, io);},100/object.speed);
		//}
	} catch (e) {
		console.warn("FATAL ERROR: "+e.toString());
		if(object.navName != undefined) delete objNav[object.navName];
		if(object.name != undefined) delete zombies[object.name];
	}
}

function deleteZombie(zombieName) {
	var object = zombies[zombieName];
	if(object.navName != undefined) delete objNav[object.navName];
	if(object.name != undefined) delete zombies[object.name];
}

function attackCheck(io) {
	var zombieCol = [];
	var objCol = [];
	var p0Objs = [];
	var p1Objs = [];
	for(var i in zombies) {
		if(zombies.hasOwnProperty(i)) {
			zombieCol.push([zombies[i], i]);
		}
	}
	for(var i in objects) {
		if(objects.hasOwnProperty(i) && objects[i].hasOwnProperty("Characters")) {
			for(var j in objects[i].Characters.Minions) {
				if(objects[i].Characters.Minions.hasOwnProperty(j)) {
					objCol.push([objects[i].Characters.Minions[j], i, "Minions"]);
					if(objects[i].PlayerID == 0)
						p0Objs.push([objects[i].Characters.Minions[j], i, "Minions"]);
					else if(objects[i].PlayerID == 1)
						p1Objs.push([objects[i].Characters.Minions[j], i, "Minions"]);
				}
			}
			for(var j in objects[i].Characters.Commanders) {
				if(objects[i].Characters.Commanders.hasOwnProperty(j)) {
					objCol.push([objects[i].Characters.Commanders[j], i, "Commanders"]);
					if(objects[i].PlayerID == 0)
						p0Objs.push([objects[i].Characters.Commanders[j], i, "Commanders"]);
					else if(objects[i].PlayerID == 1)
						p1Objs.push([objects[i].Characters.Commanders[j], i, "Commanders"]);
				}
			}
			for(var j in objects[i].Characters.Hero) {
				if(objects[i].Characters.Hero.hasOwnProperty(j)) {
					objCol.push([objects[i].Characters.Hero[j], i, "Hero"]);
					if(objects[i].PlayerID == 0)
						p0Objs.push([objects[i].Characters.Hero[j], i, "Hero"]);
					else if(objects[i].PlayerID == 1)
						p1Objs.push([objects[i].Characters.Hero[j], i, "Hero"]);
				}
			}
		}
	}
	for(var i=0;i<p0Objs.length;i++) {
		for(var j=0;j<p1Objs.length;j++) {
			if(checkCollision(p0Objs[i][0], p1Objs[j][0], p0Objs[i][0].attackRadius, p1Objs[j][0].collisionRadius)) {
				p0Objs[i][0].health -= p1Objs[j][0].attackPower;
				p1Objs[j][0].health -= p0Objs[i][0].attackPower;
				console.log(p0Objs[i][0].name + " was hit! Health: " + p0Objs[i][0].health);
				console.log(p1Objs[j][0].name + " was hit! Health: " + p1Objs[j][0].health);
			}
		}
	}
	for(var i=0;i<zombieCol.length;i++) {
		for(var j=0;j<objCol.length;j++) {
			//Player attacking
			if(checkCollision(objCol[j][0], zombieCol[i][0], objCol[j][0].attackRadius, zombieCol[i][0].collisionRadius)) {
				zombieCol[i][0].health -= objCol[j][0].attackPower;
				console.log(zombieCol[i][0].name + " was hit! Health: " + zombieCol[i][0].health);
			}
			//Zombie attacking
			if(checkCollision(zombieCol[i][0], objCol[j][0], zombieCol[i][0].attackRadius, objCol[j][0].collisionRadius)) {
				objCol[j][0].health -= zombieCol[i][0].attackPower;
				console.log(objCol[j][0].name + " was hit! Health: " + objCol[j][0].health);
			}
		}
	}
	for(var i=0;i<objCol.length;i++) {
		if(objCol[i][0].health < 1) {
			console.log(objCol[i][0].name + " has died!");
			delete objects[objCol[i][1]].Characters[objCol[i][2]][objCol[i][0].name];
			if(objects[objCol[i][1]].Characters.Hero.length() == 0 && objects[objCol[i][1]].Characters.Commanders.length() == 0 && objects[objCol[i][1]].Characters.Minions.length() == 0) {
				var winner;
				for(var j in objects) {if(j != objCol[i][1]) {winner = j; break;}}
				io.sockets.emit('endGame', {winner: winner, winnerID: objects[winner].PlayerID, minionsLeft: objects[winner].Characters.Minions.length(), commandersLeft: objects[winner].Characters.Commanders.length(), heroLeft: objects[winner].Characters.Hero.length()});
				console.log("Game ended, killing server...");
				process.exit(0);
				return;
			}
		}
	}
	for(var i=0;i<zombieCol.length;i++) {
		if(zombieCol[i][0].health < 1) {
			console.log(zombieCol[i][0].name + " has died!");
			delete zombies[zombieCol[i][1]];
		}
	}
}

function checkCollision(objA, objB, objAColRad, objBColRad) {
	var distance = Math.pow(objA.pos.x - objB.pos.x,2) + Math.pow(objA.pos.z - objB.pos.z,2);
	return distance < objAColRad + objBColRad
}

function reproduce() {
	for(var i in objects) {
		if(objects.hasOwnProperty(i)) {
			var commCount = objects[i].Characters.Commanders.length(),
				heroCount = objects[i].Characters.Hero.length();
			for(var j=0;j<commCount;j++) {
				var minion = new objTypes.Minion(i);
				minion.name = minion.name + "-" + j;
				minion.pos = playerSpawn[objects[i].PlayerID].clone();
				minion.targetPos = playerSpawn[objects[i].PlayerID].clone();
				objects[i].Characters.Minions[minion.name] = minion;
				startMoveTimer(i, "Minions", minion.name);
			}
			for(var j=0;j<heroCount;j++) {
				var commander = new objTypes.Commander(i);
				commander.name = commander.name + "-" + j;
				commander.pos = playerSpawn[objects[i].PlayerID].clone();
				commander.targetPos = playerSpawn[objects[i].PlayerID].clone();
				objects[i].Characters.Commanders[commander.name] = commander;
				startMoveTimer(i, "Commanders", commander.name);
			}
		}
	}
}


function minionGather() {
	for(var i in objects) {
		if(objects.hasOwnProperty(i)) {
			for(var j in objects[i].Characters.Minions) {
				if(objects[i].Characters.Minions.hasOwnProperty(j)) {
					if(Math.floor(Math.random()*4)==0)
						objects[i].Characters.Minions[j].inventory.building += Math.ceil(25/objects[i].Characters.Minions.length());
					else
						objects[i].Characters.Minions[j].inventory.food += Math.ceil(50/objects[i].Characters.Minions.length());
				}
			}
		}
	}
}



function minionGatherTeam() {
	for(var i in objects) {
		if(objects.hasOwnProperty(i)) {
			objects[i].inventory.food += Math.floor(objects[i].Characters.Minions.length()/Math.pow(objects[i].inventory.food,1/4));
			objects[i].inventory.building += Math.floor(objects[i].Characters.Minions.length()/Math.pow(objects[i].inventory.building,1/2));
		}
	}
}

function createBuilding(socket, data) {
	var building = new objTypes.Building(data.name, data.type, socket.id)
	building.pos = data.pos;
	objects[socket.id].buildings[data.name] = building;

}

module.exports = {
	objects: objects,
	startSpawningZombies: startSpawningZombies,
	zombies: zombies,
	newPlayer: newPlayer,
	selectedObj: selectedObj,
	clickPos: clickPos,
	disconnected: disconnected,
	attackCheck: attackCheck,
	requiredModels: requiredModels,
	reproduce: reproduce,
	minionGather: minionGather,
	minionGatherTeam: minionGatherTeam,
	createBuilding: createBuilding,
	events: events,
	objNav: objNav,
	deleteZombie: deleteZombie,
	startMoveTimer: startMoveTimer,
	startZombieMoveTimer: startZombieMoveTimer,
	stopMoveTimer: stopMoveTimer
};