function Base() {
	this.name = new Date().getTime();
	this.scale = {x:0.5,y:0.5,z:0.5};
	/*this.pos = {
		x: 0,
		y: 11.7,
		z: 0
	};*/
	this.pos = {x:64,y:3,z:64};
	this.model = "";

	return this;
}

function Character() {
	Base.call(this);
	this.health = 0;
	this.speed = 0;
	this.selected = false;
	this.attackPower = 1;
	this.attackRadius = 1;
	this.collisionRadius = 1;
	this.navName = this.name + "Nav";
	this.inventory = {food: 0, building: 0};

	return this;
}

function Minion(owner) {
	Character.call(this);
	this.name = "Minion" + this.name;
	this.health = 100;
	this.speed = 0.125;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Commander(owner) {
	Character.call(this);
	this.name = "Commander" + this.name;
	this.health = 250;
	this.speed = 0.25;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Hero(owner) {
	Character.call(this);
	this.name = "Hero" + this.name;
	this.health = 500;
	this.speed = 0.5;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Zombie(followedObject) {
	Character.call(this);
	this.name = "Zombie" + this.name;
	this.health = 25;
	this.speed = 0.0625;
	this.model = "zombie";
	this.followedObject = followedObject;
	this.timeToLive = 100;
	this.navName = this.name + "Nav";

	return this;
}

function Building(name, type, owner) {
	Base.call(this);
	this.name = "Building" + name + this.name;
	this.type = type;
	this.model = "minionBase";
	this.owner = owner;
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