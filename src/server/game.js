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
	timerCount = 0,
	objCount = 0;

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
				var zombie = new objTypes.Zombie(objToFollow, ++objCount);
				//zombie.pos = zombie.followedObject.pos.clone();
				zombie.pos = zombieSpawn[Math.floor(Math.random()*zombieSpawn.length)];
				zombie.targetPos = zombie.followedObject.pos;
				//zombies["Zombie"+zombieID] = {name: "Zombie"+zombieID, model:"zombie", pos: objects[objectToFollow].pos.clone(), followedObj: objects[objectToFollow]};
				//setupNavData(navData.level1NavData, 128, 128, function(a,b){zombiePath(a,b,zombie,zombie.followedObject,1,1,io)});
				zombies[zombie.uid] = zombie;
				startZombieMoveTimer(zombie.uid);
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
		inventory: {food: 80, building: 100, foodStorage: 100},
		selectedObj: {name: "", type: ""},
		nextClickBuild: false,
		nextBuildingPrice: 0
	};
	var hero = new objTypes.Hero(socket.id, ++objCount);
	hero.pos = playerSpawn[objects[socket.id].PlayerID].clone();
	hero.targetPos = playerSpawn[objects[socket.id].PlayerID].clone();
	objects[socket.id].Characters.Hero[hero.uid] = hero;
	startMoveTimer(socket.id, "Hero", hero.uid);
	var commander = new objTypes.Commander(socket.id, ++objCount);
	commander.pos = playerSpawn[objects[socket.id].PlayerID].clone();
	commander.targetPos = playerSpawn[objects[socket.id].PlayerID].clone();
	objects[socket.id].Characters.Commanders[commander.uid] = commander;
	startMoveTimer(socket.id, "Commanders", commander.uid);
	if(objects.length() == 2)
		events.emit('startGame');
	//new Date().getTime()
	//io.sockets.emit('newPlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos});
}

function clickPos(socket, io, data) {
	if(!objects[socket.id]) return;
	console.log(data);
	if(objects[socket.id].nextClickBuild) {
		createBuilding(socket, {
			name: "Building"+new Date().getTime(),
			type: "basic",
			pos: {
				x: data.x,
				y: 3,
				z: data.z
			}
		});
		objects[socket.id].inventory.building -= objects[socket.id].nextBuildingPrice;
		objects[socket.id].nextClickBuild = false;
		objects[socket.id].nextBuildingPrice = 0;
		return;
	}
	try {
		if(objects[socket.id].selectedObj.name != "") {
			var selectedObj = objects[socket.id].Characters[objects[socket.id].selectedObj.type][objects[socket.id].selectedObj.name];
			selectedObj.targetPos = {x: Math.floor(data.x), y: 3, z: Math.floor(data.z)};
			console.log(objects[socket.id].selectedObj.targetPos);
			//setupNavData(navData.level1NavData, 128, 128, function(a,b){runPathData(a,b,objects[socket.id].Characters[objects[socket.id].selectedObj.type][objects[socket.id].selectedObj.name],{x:Math.floor(data.x),z:Math.floor(data.z)},1,4,socket,io)});
			events.emit('cluster', {cmd: 'setupNavData', params: {object: selectedObj, objectType: objects[socket.id].selectedObj.type}});
		}
	} catch(e) {
		console.warn("FATAL CLICKPOS ERROR: "+e.toString());
	}
}

function selectedObj(socket, io, data) {
	if(!objects[socket.id]) return;
	console.log(data);
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

function deleteZombie(zombieName) {
	var object = zombies[zombieName];
	if(object.navName != undefined) delete objNav[object.navName];
	if(object.name != undefined) delete zombies[object.uid];
}

function attackCheck(io) {
	var zombieCol = [];
	var objCol = [];
	var buildingCol = [];
	var p0Objs = [];
	var p1Objs = [];
	var p0Buildings = [];
	var p1Buildings = [];
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
			for(var j in objects[i].buildings) {
				if(objects[i].buildings.hasOwnProperty(j)) {
					buildingCol.push([objects[i].buildings[j], i]);
					if(objects[i].PlayerID == 0)
						p0Buildings.push([objects[i].buildings[j], i]);
					else if(objects[i].PlayerID == 1)
						p1Buildings.push([objects[i].buildings[j], i]);
				}
			}
		}
	}
	for(var i=0;i<p0Objs.length;i++) {
		for(var j=0;j<p1Buildings.length;j++) {
			if(checkCollision(p0Ojbs[i][0], p1Buildings[j][0], p0Objs[i][0].attackRadius, p1Buildings[j][0].collisionRadius)) {
				p1Buildings[j][0].health -= p0Objs[i][0].attackPower;
				console.log(p1Buildings[j][0].uid + " was hit! Health: " + p1Buildings[j][0].health)
			}
		}
	}
	for(var i=0;i<p1Objs.length;i++) {
		for(var j=0;j<p0Buildings.length;j++) {
			if(checkCollision(p1Ojbs[i][0], p0Buildings[j][0], p1Objs[i][0].attackRadius, p0Buildings[j][0].collisionRadius)) {
				p0Buildings[j][0].health -= p1Objs[i][0].attackPower;
				console.log(p0Buildings[j][0].uid + " was hit! Health: " + p0Buildings[j][0].health)
			}
		}
	}
	for(var i=0;i<zombieCol.length;i++) {
		for(var j=0;j<buildingCol.length;j++) {
			if(checkCollision(zombieCol[i][0], buildingCol[j][0], zombieCol[i][0].attackRadius, buildingCol[j][0].collisionRadius)) {
				buildingCol[j][0].health -= zombieCol[i][0].attackPower;
				console.log(buildingCol[j][0].uid + " was hit! Health: " + buildingCol[j][0].health)
			}
		}
	}
	for(var i=0;i<p0Objs.length;i++) {
		for(var j=0;j<p1Objs.length;j++) {
			if(checkCollision(p0Objs[i][0], p1Objs[j][0], p0Objs[i][0].attackRadius, p1Objs[j][0].collisionRadius)) {
				p0Objs[i][0].health -= p1Objs[j][0].attackPower;
				p1Objs[j][0].health -= p0Objs[i][0].attackPower;
				console.log(p0Objs[i][0].uid + " was hit! Health: " + p0Objs[i][0].health);
				console.log(p1Objs[j][0].uid + " was hit! Health: " + p1Objs[j][0].health);
			}
		}
	}
	for(var i=0;i<zombieCol.length;i++) {
		for(var j=0;j<objCol.length;j++) {
			//Player attacking
			if(checkCollision(objCol[j][0], zombieCol[i][0], objCol[j][0].attackRadius, zombieCol[i][0].collisionRadius)) {
				zombieCol[i][0].health -= objCol[j][0].attackPower;
				console.log(zombieCol[i][0].uid + " was hit! Health: " + zombieCol[i][0].health);
			}
			//Zombie attacking
			if(checkCollision(zombieCol[i][0], objCol[j][0], zombieCol[i][0].attackRadius, objCol[j][0].collisionRadius)) {
				objCol[j][0].health -= zombieCol[i][0].attackPower;
				console.log(objCol[j][0].uid + " was hit! Health: " + objCol[j][0].health);
			}
		}
	}
	for(var i=0;i<objCol.length;i++) {
		if(objCol[i][0].health < 1) {
			console.log(objCol[i][0].uid + " has died!");
			delete objects[objCol[i][1]].Characters[objCol[i][2]][objCol[i][0].uid];
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
			console.log(zombieCol[i][0].uid + " has died!");
			delete zombies[zombieCol[i][1]];
		}
	}
	for(var i=0;i<buildingCol.length;i++) {
		if(buildingCol[i][0].health < 1) {
			console.log(buildingCol[i][0].uid + " has died!");
			delete objects[buildingCol[i][1]].buildings[buildingCol[i][0].uid];
		}
	}
	calculateFoodLimits();
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
				var minion = new objTypes.Minion(i, ++objCount);
				minion.name = minion.name + "-" + j;
				minion.pos = playerSpawn[objects[i].PlayerID].clone();
				minion.targetPos = playerSpawn[objects[i].PlayerID].clone();
				objects[i].Characters.Minions[minion.uid] = minion;
				startMoveTimer(i, "Minions", minion.uid);
			}
			for(var j=0;j<heroCount;j++) {
				var commander = new objTypes.Commander(i, ++objCount);
				commander.name = commander.name + "-" + j;
				commander.pos = playerSpawn[objects[i].PlayerID].clone();
				commander.targetPos = playerSpawn[objects[i].PlayerID].clone();
				objects[i].Characters.Commanders[commander.uid] = commander;
				startMoveTimer(i, "Commanders", commander.uid);
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
			objects[i].inventory.food += Math.floor(objects[i].Characters.Minions.length()/(Math.pow((objects[i].inventory.food ? objects[i].inventory.food : 1),1/4)*Math.random()*3));
			objects[i].inventory.building += Math.floor(objects[i].Characters.Minions.length()/(Math.pow((objects[i].inventory.building ? objects[i].inventory.building : 1),1/2)*Math.random()*3));
		}
	}
	calculateFoodLimits();
}

function calculateFoodLimits() {
	for(var i in objects) {
		if(objects.hasOwnProperty(i)) {
			objects[i].inventory.foodStorage = 100;
			for(var j in objects[i].buildings) {
				if(objects[i].buildings.hasOwnProperty(j)) {
					objects[i].inventory.foodStorage += objects[i].buildings[j].storageSize;
				}
			}
			if(objects[i].inventory.food > objects[i].inventory.foodStorage)
				objects[i].inventory.food = objects[i].inventory.foodStorage;
		}
	}
}

function createBuilding(socket, data) {
	var building = new objTypes.Building(data.name, data.type, socket.id, ++objCount);
	building.pos = data.pos;
	building.storageSize = 15;
	building.health = 5;
	building.maxHealth = 5;
	objects[socket.id].buildings[building.uid] = building;
}

function nextClickBuild(socket) {
	if(objects[socket.id].inventory.building < 50) {
		socket.emit('alert', "You do not have enough resources to build this! You are "+(50-objects[socket.id].inventory.building)+" short!");
		return false;
	}
	objects[socket.id].nextBuildingPrice = 50;
	objects[socket.id].nextClickBuild = true;
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
	stopMoveTimer: stopMoveTimer,
	nextClickBuild: nextClickBuild
};
