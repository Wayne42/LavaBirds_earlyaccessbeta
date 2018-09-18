//macht aus 225.13532 = 22 ... nur die ersten zwei stellen werden zurückgegeben
function normalizeNumber(NUMBER) {
	return parseInt(Math.floor(NUMBER) / 10);
}

//zufällige zahl zwischen 1 und MAX
function randomNumber(MAX) {
	return Math.floor(Math.random() * MAX + 1);
}

var canvas = document.getElementById('MAINFRAME');
var canvasContext = canvas.getContext('2d');

class World {
	constructor() {
		this.doTheyCollide = function(OBJa, OBJb) {
			OBJa.updateBoundings();
			OBJb.updateBoundings();
			//this.printBoundings(OBJa);
			//this.printBoundings(OBJb);
			//console.log(OBJa.leftBounding +'>=' +OBJb.leftBounding +'&& ' +OBJa.leftBounding +'<=' +OBJb.rightBounding);
			if (OBJa.leftBounding >= OBJb.leftBounding && OBJa.leftBounding <= OBJb.rightBounding) {
				//console.log(OBJa.lowerBounding +'>=' +OBJb.upperBounding +'&& ' +OBJa.lowerBounding +'>=' +OBJb.lowerBounding);
				if (OBJa.lowerBounding >= OBJb.upperBounding && OBJa.lowerBounding <= OBJb.lowerBounding) {
					return true;
				}
			}
			return false;
		}
		this.printBoundings = function(OBJ) {
			console.log("----------------");
			console.log(OBJ.constructor.name + ' ID: ' + OBJ.id);
			console.log('upper: ' + OBJ.upperBounding);
			console.log('lower: ' + OBJ.lowerBounding);

			console.log('left: ' + OBJ.leftBounding);
			console.log('right: ' + OBJ.rightBounding);

			console.log("----------------");
		}
	}

}

World = new World();

var WorldObjectsList = [];

class WorldObject {
	constructor(WORLDOBJECT) {
		this.id = WORLDOBJECT.id;
        //mitte des objekts
        this.xPos = WORLDOBJECT.xPos || 0;
        this.yPos = WORLDOBJECT.yPos || 0;

        //breite und höhe
        this.width = WORLDOBJECT.width || 1;
        this.height = WORLDOBJECT.height || 1;

        //linke und rechte grenze des objekts
        this.leftBounding = this.xPos - this.width / 2;
        this.rightBounding = this.xPos + this.width / 2;

        this.upperBounding = this.yPos - this.height / 2;
        this.lowerBounding = this.yPos + this.height / 2;

        //richtungsvektor
        this.xVelocity = WORLDOBJECT.xVelocity;
        this.yVelocity = WORLDOBJECT.yVelocity;

        this.xVelocityB = this.xVelocity;
        this.yVelocityB = this.yVelocity;

        this.gravity = WORLDOBJECT.gravity || 0.5; //wie sehr die schwerkraft beeinflusst
        this.gravityB = this.gravity;

        this.friction = WORLDOBJECT.friction;
        this.frictionB = this.friction;

        this.hits = WORLDOBJECT.hits;
        this.maxHits = WORLDOBJECT.maxHits;
        this.stuck = WORLDOBJECT.stuck;

        this.color = WORLDOBJECT.color;

		this.drawObject = function drawObject() {
			canvasContext.fillStyle = this.color || 'white';
			canvasContext.fillRect(this.leftBounding, this.upperBounding, this.width, this.height);

			this.additionalDrawObject();
		};
		this.additionalDrawObject = function() {};
	}
}

		var platformState = 0;
		var airbornState = 0;

class Bird extends WorldObject {
	constructor(BIRD) {
		super(BIRD);

        this.birdID = BIRD.birdID;

        this.isOnPlatform = BIRD.isOnPlatform;
        this.whichPlatform = BIRD.whichPlatform;

        this.item = BIRD.item; //momentan ausgerüstetes item;
        this.color = BIRD.color;

        this.lifes = BIRD.lifes;
        this.energy = BIRD.energy;
        this.maxEnergy = BIRD.maxEnergy;


		this.spriteSheet = new Image();
		this.spriteSheet.src = 'client/imgs/birdSprites.png';

		this.spriteSheetSections = 32;

		this.spriteSheetPlatform = 0;
		this.spriteSheetAir = 32;

		
		this.spriteStateOnPlatform = 3;
		
		this.spriteStateAirborn = 4;

		this.additionalDrawObject = function(BOUNDINGS) {
			canvasContext.font = "24px Arial";
			canvasContext.fillText('Player Name : BIRD_' + this.id, this.leftBounding, this.upperBounding - this.height);
			canvasContext.fillText('Energy: ' + this.energy + '/' + this.maxEnergy, this.leftBounding, this.upperBounding - this.height * 2);
		
				if(this.isOnPlatform){
					if(platformState > this.spriteStateOnPlatform){
					platformState = 0;
				}
					canvasContext.drawImage(
						this.spriteSheet,
						platformState*32, //source x
						0,	//source y
						32, //frame width
						32, //frame height
						this.leftBounding - this.width/2, //pos x
						this.upperBounding - this.width/2, //pos y
						32,32); //frame dimensions
			}
			else{
				if(airbornState > this.spriteStateAirborn){
					airbornState = 0;
				}
					canvasContext.drawImage(
						this.spriteSheet,
						airbornState*32, //source x
						32,	//source y
						32, //frame width
						32, //frame height
						this.leftBounding - this.width/2, //pos x
						this.upperBounding - this.width/2, //pos y
						32,32); //frame dimensions
				
				
			}
			if(FRAMES%60 == 0){
						platformState++;
						airbornState++;
					}
		}
		this.jump = function() {
			if (this.isOnPlatform) {
				this.yPos += -this.height;
				this.yVelocity += -7;
			} else if (this.energy > 0) {
				this.yVelocity += -5;
				this.energy--;
			}
			console.log(this.energy);
		}

		this.fall = function() {
			this.yVelocity += 3;
		}

		this.left = function() {
			this.xVelocity += -3;
		}
		this.right = function() {
			this.xVelocity += 3;
		}

		this.setPos = function(X, Y) {
			this.xPos = X;
			this.yPos = Y;
		}
	}
}

class Platform extends WorldObject {
	constructor(PLATFORM) {
		super(PLATFORM);

		this.state = 1;
		this.spriteSheet = new Image();
		this.spriteSheet.src = 'client/imgs/platform.png';

		this.checkCollision = function() {
			//canvas überschritten?
			//unten
			if (this.yPos >= canvas.height) {
				return 1;
			}
		};
		this.additionalDrawObject = function() {
			canvasContext.drawImage(
						this.spriteSheet,
						0, //source x
						0,	//source y
						75, //frame width
						10, //frame height
						this.leftBounding - 4, //pos x
						this.upperBounding - 4, //pos y
						this.width + 7,this.height + 5); //frame dimensions
		}
	}
}

function initWorld(DATA){
	WorldObjectsList = DATA.world;
	for(let i in WorldObjectsList){
		if(WorldObjectsList[i] != null){
			if(WorldObjectsList[i].birdID){
				WorldObjectsList[i] = new Bird(WorldObjectsList[i]);
			}
			else if(WorldObjectsList[i].platformID){
				WorldObjectsList[i] = new Platform(WorldObjectsList[i]);
			}
		}
	}
}
function updateWorld(DATA){
	WorldObjectsList = DATA.world;
	for(let i in WorldObjectsList){
		if(WorldObjectsList[i] != null){
			if(WorldObjectsList[i].birdID){
				WorldObjectsList[i] = new Bird(WorldObjectsList[i]);
			}
			else if(WorldObjectsList[i].platformID){
				WorldObjectsList[i] = new Platform(WorldObjectsList[i]);
			}
		}
	}
	gameLoop();
}
var FRAMES = 0;
function gameLoop() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	for (let i in WorldObjectsList) {
		if(WorldObjectsList[i] != null){
				if(WorldObjectsList[i].id)
				{
					try{
							WorldObjectsList[i].drawObject();
					}
					catch(e){}
				}
				
		}
	
	}
	
	FRAMES++;
	document.getElementById('status').innerHTML = FRAMES + '';
}

