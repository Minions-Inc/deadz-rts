function Base() {
	this.name = new Date().getTime();
	this.scale = {x:0.25,y:0.25,z:0.25};
	/*this.pos = {
		x: 0,
		y: 11.7,
		z: 0
	};*/
	this.pos = {x:64,y:3,z:64};
	this.model = "";
	this.uid = 0;
	this.objectType = 0;

	return this;
}

function Character() {
	Base.call(this);
	this.health = 0;
	this.maxHealth = 0;
	this.speed = 0;
	this.selected = false;
	this.attackPower = 1;
	this.attackRadius = 1;
	this.collisionRadius = 1;
	this.navData = [];
	this.grid = null;
	this.finder = null;
	this.inventory = {food: 0, building: 0};
	this.targetPos = {x:0, y:3, z:0};
	this.moveTimer = 0;

	return this;
}

function Minion(owner, uid) {
	Character.call(this);
	this.name = "Minion" + this.name;
	this.health = 100;
	this.maxHealth = 100;
	this.speed = 0.125;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";
	this.uid = uid;
	this.objectType = 1;

	return this;
}

function Commander(owner, uid) {
	Character.call(this);
	this.name = "Commander" + this.name;
	this.health = 250;
	this.maxHealth = 250;
	this.speed = 0.25;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";
	this.uid = uid;
	this.objectType = 2;

	return this;
}

function Hero(owner, uid) {
	Character.call(this);
	this.name = "Hero" + this.name;
	this.health = 500;
	this.maxHealth = 500;
	this.speed = 0.5;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";
	this.uid = uid;
	this.objectType = 3;

	return this;
}

function Zombie(followedObject, uid) {
	Character.call(this);
	this.name = "Zombie" + this.name;
	this.health = 25;
	this.maxHealth = 25;
	this.speed = 0.0625;
	this.model = "zombie";
	this.followedObject = followedObject;
	this.timeToLive = 100;
	this.navName = this.name + "Nav";
	this.uid = uid;
	this.objectType = 4;

	return this;
}

function Building(name, type, owner, uid) {
	Base.call(this);
	this.name = "Building" + name + this.name;
	this.type = type;
	this.model = "RTS-Barracks1";
	this.owner = owner;
	this.health = 0;
	this.maxHealth = 0;
	this.collisionRadius = 5;
	this.storageSize = 0;
	this.uid = uid;
	this.objectType = 5;
	this.targetPos = 0;
}


module.exports = {
	Base: Base,
	Character: Character,
	Minion: Minion,
	Commander: Commander,
	Hero: Hero,
	Zombie: Zombie,
	Building: Building
};