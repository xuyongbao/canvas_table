var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var height = canvas.height = 400;
var width = canvas.width = 400;
var fov = Math.PI / 3;
var fovVertical = fov;
var fovHorizontal = 2 * Math.atan(height * Math.tan(fov / 2) / width);
var worldVelocity = {x : 0, y : 0, z : 0, xrot : 0.1, yrot : 0.3, zrot : 0};
var worldTransform = {x : 0, y : 0, z : 6, xrot : 0.1, yrot : 0.3, zrot : 0};
var animationDuration = 50;



Math.easeInOutQuint = function(t, b, c, d){
	t /= d/2;
	if(t < 1) return c / 2 * t * t * t * t * t + b ;
	t -= 2;
	return c / 2 * (t * t * t * t * t + 2) + b; 
};

var Point = function(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
};
Point.prototype.project = function(){
	return new Point(
		width * (this.x / (this.z *2 * Math.tan(fovVertical / 2)) + 1 / 2),
		height * (this.y / (this.z * 2 *Math.tan(fovHorizontal / 2)) + 1 / 2)
	);
};
Point.prototype.rotateX = function(theta){
	return new Point(
		this.x,
		this.y * Math.cos(theta) - this.z * Math.sin(theta),
		this.y * Math.sin(theta) + this.z * Math.cos(theta)
	);
};
Point.prototype.rotateY = function(theta){
	return new Point(
		this.x * Math.cos(theta) - this.z * Math.sin(theta),
		this.y,
		this.x * Math.sin(theta) + this.z * Math.cos(theta)
	);
};
Point.prototype.rotateZ = function(theta){
  return new Point(
	  this.x * Math.cos(theta) - this.y * Math.sin(theta),
	  this.x * Math.sin(theta) + this.y * Math.cos(theta),
	  this.z
	);
};
Point.prototype.translate = function(x, y, z){
	return new Point(
		this.x + x,
		this.y + y,
		this.z + z
	);
};

var queue = [];
var queueQuad = function(point0, point1, point2, point3, colour){
	var averageZ = (point0.z + point1.z + point2.z + point3.z) / 4;
	var element = [colour, averageZ, point0.project(), point1.project(), point2.project(), point3.project()];
	if(queue.length === 0){
		queue[0] = element;
	}else{
		queue[queue.length] = element;
		for(var x = queue.length -2; x >= 0 &&queue[x][1] < averageZ ; x -= 1){
			queue[x + 1] = queue[x];
			queue[x] = element;
		}
	}
};
var clearDrawQueue = function(){
	queue = [];
};
var drawQueue = function(){
	for(var x = 0;x < queue.length;x++){
		ctx.fillStyle = queue[x][0];
		ctx.strokeStyle = "#000";
		ctx.lineWith = 0.3;
		ctx.beginPath();
		ctx.moveTo(queue[x][2].x, queue[x][2].y);
		for(var y = 3; y < queue[x].length; y++)
			ctx.lineTo(queue[x][y].x, queue[x][y].y);
		ctx.lineTo(queue[x][2].x,queue[x][2].y);
		ctx.fill();
		ctx.stroke();
	}
};

var faces = [[0,1,3,2],[0,4,5,1],[1,5,7,3],[2,3,7,6],[0,2,6,4],[4,6,7,5]];
//White	orange green red blue yellow grey(inner sides)
var faceColours = ["#FFFFFF","#C41E3A","#009E60","#FF5800","#0051BA","#FFD500","#222"]; 
//"#FFFFFF","#C41E3A","#009E60","#0051BA","#FF5800","#FFD500"
var Cube = function(xpos, ypos, zpos, rotx, roty, rotz){
	this.x = xpos;
	this.y = ypos;
	this.z = zpos;
	this.rotx = rotx;
	this.roty = roty;
	this.rotz = rotz;

	this.faceMatrix = [0,1,2,3,4,5];

	if(xpos < 1)
		this.faceMatrix[5] = 6;
	if(xpos >= 0)
		this.faceMatrix[0] = 6;
	if(ypos < 1)
		this.faceMatrix[3] = 6;
	if(ypos >= 0)
		this.faceMatrix[1] = 6;
	if(zpos < 1)
		this.faceMatrix[2] = 6;
	if(zpos >= 0)
		this.faceMatrix[4] = 6;

	this.points = [];
	for(var x = -0.5; x<= 0.5; x++)
		for(var y = -0.5; y <= 0.5; y++)
			for(var z = -0.5; z <= 0.5; z++)
				this.points.push(new Point(x, y, z));
};
Cube.prototype.queue = function(){
	for(var x = 0; x < 6; x++){
		var quad = [];
		for(var y = 0; y < 4; y++){
			var point = this.points[faces[x][y]];
			point = point.translate(this.x, this.y , this.z).rotateX(this.rotx).rotateY(this.roty).rotateZ(this.rotz).rotateX(worldTransform.xrot).rotateY(worldTransform.yrot).rotateZ(worldTransform.zrot).translate(worldTransform.x, worldTransform.y, worldTransform.z);
			quad.push(point);
		}
		queueQuad(quad[0], quad[1], quad[2], quad[3], faceColours[this.faceMatrix[x]]);
	}
};
Cube.prototype.rotateColours = function(xrot, yrot, zrot){
	for(var x = 0;x < xrot;x++)
		this.faceMatrix = [this.faceMatrix[0],this.faceMatrix[2],this.faceMatrix[3],this.faceMatrix[4],this.faceMatrix[1],this.faceMatrix[5]];
	for(var x = 0;x < yrot;x++)
		this.faceMatrix = [this.faceMatrix[2],this.faceMatrix[1],this.faceMatrix[5],this.faceMatrix[3],this.faceMatrix[0],this.faceMatrix[4]];
	for(var x = 0;x < zrot;x++)
		this.faceMatrix = [this.faceMatrix[3],this.faceMatrix[0],this.faceMatrix[2],this.faceMatrix[5],this.faceMatrix[4],this.faceMatrix[1]];
};

var slices = [[2 , 1 , 0 , 5 , 4 , 3 , 8 , 7 , 6 ],
              [11, 10, 9 , 14, 13, 12, 17, 16, 15],
              [20, 19, 18, 23, 22, 21, 26, 25, 24],
              [2 , 1 , 0 , 11, 10, 9 , 20, 19, 18],
              [5 , 4 , 3 , 14, 13, 12, 23, 22, 21],
              [8 , 7 , 6 , 17, 16, 15, 26, 25, 24],
              [6 , 3 , 0 , 15, 12, 9 , 24, 21, 18],
              [7 , 4 , 1 , 16, 13, 10, 25, 22, 19],
              [8 , 5 , 2 , 17, 14, 11, 26, 23, 20]];

var Rubiks = function(){
	this.cubies = [];
	for(var x = -1; x <= 1; x++)
		for(var y = -1; y <= 1; y++)
			for(var z = -1; z <= 1; z++)
				this.cubies.push(new Cube(x, y, z , 0, 0, 0));
};
Rubiks.prototype.queue = function(){
	if(this.animationTimer > 0)
		this.updateAnimation();
	else if(this.animationTimer == 0){
		this.endAnimation();
		this.fixColours();
		this.startAnimation();
	}
	else if(!this.animationTimer)
		this.startAnimation();
	for(var x = 0; x < this.cubies.length; x++){
		this.cubies[x].queue();
	}
};
Rubiks.prototype.startAnimation = function(){
	this.slice = parseInt(Math.random() * 9);
	this.rotationAmount = (parseInt(Math.random() * 2) + 1);
	if(Math.random() * 2 >1)
		this.rotationAmount *= -1;
	this.animationTimer = animationDuration;
};
Rubiks.prototype.updateAnimation = function(){
	this.animationTimer --;
	var currentRotation = Math.easeInOutQuint(animationDuration - this.animationTimer , 0, this.rotationAmount * Math.PI / 2, animationDuration);
	for(var x = 0; x < 9; x++){
		if(this.slice < 3)
			this.cubies[slices[this.slice][x]].rotx = currentRotation;
		else if(this.slice < 6)
			this.cubies[slices[this.slice][x]].roty = currentRotation;
		else
			this.cubies[slices[this.slice][x]].rotz = currentRotation;
	}
};
Rubiks.prototype.endAnimation = function(){
	var value = this.rotationAmount;
	if(value == -1)
		value = 3;
	else if(value == -2)
		value = 2;


	for(var x = 0; x < 9; x++){

		if(this.slice < 3)
			this.cubies[slices[this.slice][x]].rotateColours(value, 0, 0);
		else if(this.slice < 6)
			this.cubies[slices[this.slice][x]].rotateColours(0, value, 0);
		else
			this.cubies[slices[this.slice][x]].rotateColours(0, 0, value);

		this.cubies[slices[this.slice][x]].rotx = 0;
		this.cubies[slices[this.slice][x]].roty = 0;
		this.cubies[slices[this.slice][x]].rotz = 0;
	}
};
Rubiks.prototype.fixColours = function(){
	var value = this.rotationAmount;
	if(value == -1)
		value = 3;
	else if(value == -2)
		value = 2;
	
	for(var x = 0;x < value;x++){
		var temp = this.cubies[slices[this.slice][0]].faceMatrix.slice();
		this.cubies[slices[this.slice][0]].faceMatrix = this.cubies[slices[this.slice][6]].faceMatrix.slice();
		this.cubies[slices[this.slice][6]].faceMatrix = this.cubies[slices[this.slice][8]].faceMatrix.slice();
		this.cubies[slices[this.slice][8]].faceMatrix = this.cubies[slices[this.slice][2]].faceMatrix.slice();
		this.cubies[slices[this.slice][2]].faceMatrix = temp.slice();
		
		temp = this.cubies[slices[this.slice][1]].faceMatrix.slice();
		this.cubies[slices[this.slice][1]].faceMatrix = this.cubies[slices[this.slice][3]].faceMatrix.slice();
		this.cubies[slices[this.slice][3]].faceMatrix = this.cubies[slices[this.slice][7]].faceMatrix.slice();
		this.cubies[slices[this.slice][7]].faceMatrix = this.cubies[slices[this.slice][5]].faceMatrix.slice();
		this.cubies[slices[this.slice][5]].faceMatrix = temp.slice();
	}
};

var main = new Rubiks();

var draw = function(){
	ctx.clearRect(0, 0, width, height);
	
	worldTransform.x += worldVelocity.x;
	worldTransform.y += worldVelocity.y;
	worldTransform.z += worldVelocity.z;
	worldTransform.xrot += worldVelocity.xrot + 0.005;
	worldTransform.yrot += worldVelocity.yrot + 0.01;
	worldTransform.zrot += worldVelocity.zrot;
	
	worldVelocity.xrot /= 1.03;
	worldVelocity.yrot /= 1.06;
	
	clearDrawQueue();
	//queue shit here
	main.queue();
	drawQueue();
	
	requestAnimationFrame(draw);
};

requestAnimationFrame(draw);









































