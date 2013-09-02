function Character() {
	this.name = new Date().getTime();
	this.health = 0;
	this.speed = 0;
	this.selected = false;
	this.attackPower = 1;
	this.attackRadius = 1;
	this.collisionRadius = 1;
	this.scale = {x:0.5,y:0.5,z:0.5};
	/*this.pos = {
		x: 0,
		y: 11.7,
		z: 0
	};*/
	this.pos = {x:64,y:3,z:64};
	this.model = "";
	this.navName = this.name + "Nav";

	return this;
}

function Minion(owner) {
	Character.call(this);
	this.name = "Minion" + this.name;
	this.health = 100;
	this.speed = 1;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Commander(owner) {
	Character.call(this);
	this.name = "Commander" + this.name;
	this.health = 250;
	this.speed = 1.5;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Hero(owner) {
	Character.call(this);
	this.name = "Hero" + this.name;
	this.health = 500;
	this.speed = 2;
	this.model = "HumanBase";
	this.owner = owner;
	this.navName = this.name + "Nav";

	return this;
}

function Zombie(followedObject) {
	Character.call(this);
	this.name = "Zombie" + this.name;
	this.health = 25;
	this.speed = 0.25;
	this.model = "zombie";
	this.followedObject = followedObject;
	this.timeToLive = 100;
	this.navName = this.name + "Nav";

	return this;
}


module.exports = {
	Character: Character,
	Minion: Minion,
	Commander: Commander,
	Hero: Hero,
	Zombie: Zombie
};