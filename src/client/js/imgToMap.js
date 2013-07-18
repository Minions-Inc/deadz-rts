var grid, finder;

function PixelMap(canvasSrc) {
    this.map = canvasSrc;
    this.width = canvasSrc.width;
    this.height = canvasSrc.height;
    this.getValue = function(x, y) {
        return this.map.data[4 * (this.map.width * y + x)];
    };
    this.getColor = function(x, y) {
        var pixel = 4 * (this.map.width * y + x);
        return {
            r: this.map.data[pixel],
            g: this.map.data[pixel + 1],
            b: this.map.data[pixel + 2],
            a: this.map.data[pixel + 3]
        };
    };
    this.toMatrix = function(asString) {
        var matrix = [];
        for(var y=0;y<this.map.height;y++) {
            matrix[y] = [];
            for(var x=0;x<this.map.width;x++) {
                matrix[y][x] = 1-this.getValue(x,y)/255;
            }
        }
        if(asString) {
            var matrix = matrix.toString();
            matrix = "[\n\t["+matrix.replace(new RegExp("(\\d+,){"+this.map.width+"}", "g"),"$&\n").replace(/,\n/g,"],\n\t[").replace(/255/g,"1")+"]\n]";
        }
        return matrix;
    };
}

function LoadImageDataPixelMap(imgToLoad, callback) {
    var imgSrc = new Image();
    imgSrc.onload = function() {
        var canvasSrc = document.createElement("canvas");
        canvasSrc.width = imgSrc.width;
        canvasSrc.height = imgSrc.height;
        var canvas2D = canvasSrc.getContext("2d");
        canvas2D.drawImage(imgSrc, 0, 0);
        canvasSrc = canvas2D.getImageData(0, 0, canvasSrc.width, canvasSrc.height);
        callback && callback(new PixelMap(canvasSrc));
    };
    imgSrc.src = imgToLoad;
}

function makeNavData(imageSrc, height, width, callback) {
    LoadImageDataPixelMap(imageSrc,function(navData) {
        grid = new PF.Grid(width,height,c=navData.toMatrix());
        finder = new PF.AStarFinder({
            allowDiagonal:true,
            dontCrossCorners:true
        });
        callback(grid, finder);
    });
}

function setupNavData(navData, height, width, callback) {
    grid = new PF.Grid(width,height,c=navData);
    finder = new PF.AStarFinder({
        allowDiagonal:true,
        dontCrossCorners:true
    });
    callback(grid, finder);
}

function runPathData(grid, finder, object, targetPos, terrainObject, moveMult, steps, speed, navName, continued) {
    if(!continued) {
        if (typeof(objNav[navName]) !== "undefined") {
            objNav[navName] = {
                path: finder.findPath(object.position.x,object.position.z,targetPos.x,targetPos.z,grid)
            };
            return;
        } else {
            objNav[navName] = {
                path: finder.findPath(object.position.x,object.position.z,targetPos.x,targetPos.z,grid)
            };
        }
    }
    //objNav[navName].path = finder.findPath(object.position.x,object.position.z,targetPos.x,targetPos.z,grid.clone());
    var steps = (objNav[navName].path.length>steps) ? steps : objNav[navName].path.length-1;
    object.position.x=objNav[navName].path[steps][0]*moveMult;
    object.position.z=objNav[navName].path[steps][1]*moveMult;
    //console.log(objNav[navName].path);
    objNav[navName].path.shift();
    //var raycaster = new THREE.Raycaster(new THREE.Vector3(object.position.x,0,object.position.z),new THREE.Vector3(0,-1,0))
    //    object.position.y += new THREE.Raycaster(object.position,new THREE.Vector3(0,1,0)).intersectObject(terrainObject)[0].distance
    //else
    //    object.position.y -= new THREE.Raycaster(object.position,new THREE.Vector3(0,-1,0)).intersectObject(terrainObject)[0].distance
    if(new THREE.Raycaster(new THREE.Vector3(object.position.x,1000,object.position.z),new THREE.Vector3(0,-1,0)).intersectObject(terrainObject).length != 0)
        object.position.y = 1000-new THREE.Raycaster(new THREE.Vector3(object.position.x,1000,object.position.z),new THREE.Vector3(0,-1,0)).intersectObject(terrainObject)[0].distance;
    if(objNav[navName].path.length<1) {
        delete objNav[navName];
    } else if(typeof(objNav[navName]) !== "undefined") {
        setTimeout(function() {runPathData(grid, finder, object, targetPos, terrainObject, moveMult, steps, speed, navName, true);},speed);
    }
}

//makeNavData("level1NavTex.png", 500, 500, function(a,b){runPathData(a,b,objects[playerName],{x:250,z:250},objects.terrain,1,1)})Z