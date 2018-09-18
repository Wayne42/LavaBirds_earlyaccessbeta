var express = require ("express");
var app = express();
var server = require("http").Server(app);

var port = process.env.PORT || 3000;

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});

app.use("/client", express.static(__dirname + "/client"));

server.listen(port);
console.log("Server started on port: " + port);


var SOCKET_LIST = {};
 
var uniqueID = 0;

var io = require("socket.io")(server,{});

io.sockets.on("connection", function(socket){
    console.log("player connected + id: " + uniqueID);
    socket.id = uniqueID;
    uniqueID++;
    SOCKET_LIST[socket.id] = socket;

    var newBird = new Bird();
    var yourBirdID = newBird.birdID;
    socket.emit("yourBird", {
        bird: newBird
    });
    
    socket.emit("initWorld", {
        world: WorldObjectsList
    });
   
    socket.on("disconnect",function(data){
    	console.log("player disconnected + id: " + socket.id);

        for(let i in WorldObjectsList){
            if(WorldObjectsList[i].birdID == socket.id){
                delete WorldObjectsList[i];
            }
            if(WorldObjectsList[i] === null){
                WorldObjectsList.slice(i,1);
            }
        }
        delete SOCKET_LIST[socket.id];
    });
   
    socket.on("keyPressed",function(data){
        console.log(data);
        if(data.key === "left"){
            newBird.left();
        }
        else if(data.key === "right"){
            newBird.right();
        }
        else if(data.key === "up"){
            newBird.jump();
        }
        else if(data.key === "down"){
            newBird.fall();
        }
    });
   
   
});
 var FRAMES = 0;
 setInterval(function(){
    for(let i in WorldObjectsList){
            if(WorldObjectsList[i] == null){
                WorldObjectsList.splice(i, 1);
            }
            WorldObjectsList[i].draw();
        }
        for(let i in SOCKET_LIST){
            SOCKET_LIST[i].emit("update",{world: WorldObjectsList});
        }
        if(FRAMES % 6000 == 0){
            World.createPlatforms(10, 75);
        }
        FRAMES++;
},1000/60);

//macht aus 225.13532 = 22 ... nur die ersten zwei stellen werden zurückgegeben
function normalizeNumber(NUMBER) {
    return parseInt(Math.floor(NUMBER) / 10);
}

//zufällige zahl zwischen 1 und MAX
function randomNumber(MAX) {
    return Math.floor(Math.random() * MAX + 1);
}

var canvas = {};
canvas.height = 800;
canvas.width = 500;

class World {
    constructor() {
        this.doTheyCollide = function(OBJa, OBJb) {
            try{
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
            catch(e){
                return false;
            }
           
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
        this.createPlatforms = function(NUMBER, WIDTH){
            if(PlatformList.length>100){
                return;
            }
            for(let i = 0; i< NUMBER; i++){
                new Platform(false, false, WIDTH);
                console.log("plat created")
            }

        }
        this.destroyAllPlatforms = function(){
            for(let i in PlatformList){
                delete PlatformList[i];
            }
             PlatformList[0,PlatformList.length];
        }
    }

}


var WorldObjectsList = [];

class WorldObject {
    constructor(XPOS, YPOS, WIDTH, HEIGHT, GRAVITY) {

        //mitte des objekts
        this.xPos = XPOS || 0;
        this.yPos = YPOS || 0;

        //breite und höhe
        this.width = WIDTH || 1;
        this.height = HEIGHT || 1;

        //linke und rechte grenze des objekts
        this.leftBounding = this.xPos - this.width / 2;
        this.rightBounding = this.xPos + this.width / 2;

        this.upperBounding = this.yPos - this.height / 2;
        this.lowerBounding = this.yPos + this.height / 2;

        //richtungsvektor
        this.xVelocity = 0;
        this.yVelocity = 1;

        this.xVelocityB = this.xVelocity;
        this.yVelocityB = this.yVelocity;

        this.gravity = GRAVITY || 0.5; //wie sehr die schwerkraft beeinflusst
        this.gravityB = this.gravity;

        this.friction = 0.9;
        this.frictionB = this.friction;

        this.hits = 0;
        this.maxHits = 1000;
        this.stuck = false;

        this.color = 'white';

        this.id = WorldObjectsList.length;
        WorldObjectsList.push(this);

        //wenn sich die position ändert, müssen die grenzen updated werden
        this.updateBoundings = function() {
            this.leftBounding = Math.round(this.xPos - this.width / 2);
            this.rightBounding = Math.round(this.xPos + this.width / 2);

            this.upperBounding = Math.round(this.yPos - this.height / 2);
            this.lowerBounding = Math.round(this.yPos + this.height / 2);
        }
        //alles an bewegung für das objekt resetten
        this.resetMovement = function() {
            this.xVelocity = this.xVelocityB;
            this.yVelocity = this.yVelocityB;

            this.gravity = this.gravityB;
        };
        //objekt feststecken
        this.makeStuck = function() {
            this.xVelocity = 0;
            this.yVelocity = 0;
            this.gravity = 0;
            this.fraction = 1;

            this.stuck = true;

        };
        this.stuckStatusHandler = function() {
            if (this.hits > this.maxHits) {
                this.reset();
            }
            this.hits++;
        };
        //reset funktion, gewöhnlich falls untere grenze erreicht wird
        this.reset = function() {
            this.xPos = randomNumber(canvas.width);
            this.yPos = randomNumber(10);
            this.hits = 0;
            this.stuck = false;
            this.updateBoundings();
            this.resetMovement();
        };

        this.checkWallCollision = function() {
            //unten
            if (this.yPos >= canvas.height) {
                return 1;
            }
            //berüht obere wand
            if (this.yPos <= 0) {
                return 5;
            }
            //berührt linke wand?
            if (this.xPos <= 0) {
                return 2;
            }
            //berührt rechte wand?
            if (this.xPos >= canvas.width) {
                return 3;
            }
            return -1;
        };
        this.collisionHandler = function(COLLIDEDWITH) {
            COLLIDEDWITH.makeStuck();
        }
        //damit das objekt sich nicht schneller bewegen kann als seine größe. wichtig für collision detection
        this.velocityLocker = function() {
            if (this.xVelocity >= this.width) {
                this.xVelocity = this.width - this.gravity;
            }
            if (this.yVelocity >= this.height) {
                this.yVelocity = this.height - this.gravity;
            }
        }
        //zusatzlogik für wandgrenzen
        this.wallDrawHandler = function() {
            if (this.yPos <= 0) {
                this.yPos = 5;
            }
            if (this.xPos <= 0) {
                this.xPos = 5;
            }
            if (this.xPos >= canvas.width) {
                this.xPos = canvas.width - 5;
            }
        }
        this.normalDrawHandler = function() {
            this.velocityLocker();

            this.yPos += this.gravity;
            this.yPos += this.yVelocity;

            this.xPos += this.xVelocity;

            this.wallDrawHandler();

            this.xVelocity *= this.friction;
            this.yVelocity *= this.friction;
        }
        this.endDrawLoop = function() {
            this.updateBoundings();
        }
        this.draw = function() {
            let wallCollision = this.checkWallCollision();
            //console.log(collision);
            if (this.stuck) {
                this.stuckStatusHandler();
            }
            //boden erreicht
            else if (wallCollision == 1) {
                this.reset();
                return;
            }
            //normalfall
            else {
                this.normalDrawHandler();
            }
            this.endDrawLoop();
        };
    }
}

var BirdList = [];
class Bird extends WorldObject {
    constructor(POS) {
        super(canvas.width / 2, 10, 15, 15, 1);

        this.birdID = BirdList.length;
        BirdList.push(this);

        this.isOnPlatform = false;
        this.whichPlatform = undefined;

        this.item = null; //momentan ausgerüstetes item;
        this.color = 'red';

        this.lifes = 3;
        this.energy = 10;
        this.maxEnergy = 10;

        this.makeStuck = function() {
        };
        this.normalDrawHandler = function() {
            for (let i = 0; i < WorldObjectsList.length; i++) {
                if (i != this.id) {
                    if (World.doTheyCollide(this, WorldObjectsList[i])) {
                        this.isOnPlatform = true;
                        this.whichPlatform = WorldObjectsList[i];
                        this.whichPlatform.makeStuck();
                        break;
                    }
                    this.isOnPlatform = false;
                }
            }

            this.velocityLocker();

            this.yPos += this.gravity;
            this.yPos += this.yVelocity;

            this.xPos += this.xVelocity;

            this.wallDrawHandler();
            if (this.isOnPlatform) {
                this.yPos = this.whichPlatform.upperBounding - 5;
                this.yVelocity = this.whichPlatform.yVelocity;
                this.gravity = this.whichPlatform.gravity;
                if (this.energy <= this.maxEnergy) {
                    this.energy++;
                }
            } else {
                this.gravity = this.gravityB;
            }
            this.xVelocity *= this.friction;
            this.yVelocity *= this.friction;
        }
        this.jump = function() {
            //console.log(this.birdID + 'moved');
            if (this.isOnPlatform) {
                this.yPos += -this.height;
                this.yVelocity += -7;
            } else if (this.energy > 0) {
                this.yVelocity += -5;
                this.energy--;
            }
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

var PlatformList = [];
class Platform extends WorldObject {
    constructor(XPOS, YPOS, WIDTH, HEIGHT) {
        let width = WIDTH || canvas.width / 2;
        let height = HEIGHT || 10;

        let xPos = XPOS || canvas.width / 2;
        let yPos = YPOS || 1 * randomNumber(700);

        super(xPos, yPos, width, height, (randomNumber(3) * 0.5));

        this.platformID = PlatformList.length;
        PlatformList.push(this);
        this.checkCollision = function() {
            //canvas überschritten?
            //unten
            if (this.yPos >= canvas.height) {
                return 1;
            }
        };
    }
}

World = new World();




