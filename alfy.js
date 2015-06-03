// JavaScript Document


function Alfy()
{
	this.tileSize = 32;
	this.mapWidthInTiles = 15;
	this.mapHeightInTiles = 15;
	this.canvas = document.getElementById('alfy');
	this.blockingTiles = new Array();
	this.setColumnBlockingTiles(0,[0,1,2,3,4,5,10,11,12]);
	this.setColumnBlockingTiles(1,[0,1,2,3,4,6,5,11,12]);
	this.setColumnBlockingTiles(2,[0,1,2,3,4,5]);
	this.setColumnBlockingTiles(3,[0,1,2,10,11]);
	this.setColumnBlockingTiles(4,[0,5,6,8,9,10,11,12]);
	this.setColumnBlockingTiles(5,[0,1,2,3,4,5,6,8,9,10,11,12]);
	this.setColumnBlockingTiles(6,[0,1,2,3,4,5,6,8,9,10,11,12,13,14]);
	this.setColumnBlockingTiles(7,[0,1,2,3,4,5,6,9,10,11,12,13,14]);
	this.setColumnBlockingTiles(8,[0,1,2,3,4,10,11,12,13,14]);
	this.setColumnBlockingTiles(9,[0,3,6,8,10,11,12,13,14]);
	this.setColumnBlockingTiles(10,[0,1,3,6,8,10,11,12,13,14]);
	this.setColumnBlockingTiles(11,[0,1,6,8,10,11,12,13,14]);
	this.setColumnBlockingTiles(12,[0,1,3,6,8,12,13,14]);
	this.setColumnBlockingTiles(13,[0,1,3,6,8,9,13,14]);
	this.setColumnBlockingTiles(14,[0,1,5,6,14]);
	
	this.tickRate = 20;
	this.ticking = false;
	this.ticker = null;
	
	this.drawRate = 20;
	this.drawing = false;
	this.drawer = null;
	this.stopOnNextDraw = false;
	
	this.playerSpeed = 80 / this.tickRate;
	this.playerTileX = 8; // the starting X,Y of the tile the player is on
	this.playerTileY = 7;
	this.playerXPos = this.playerTileX * this.tileSize; // the top left X,Y of the player, from 0 to this.width, this.height
	this.playerYPos = this.playerTileY * this.tileSize;
	this.playerPath = new Array(); // an array of AStarTiles
	
	this.playerSpriteFps = 8; // number of frames per second the sprite image cycles at when moving
	this.numPlayerSpritePositions = 4;
	this.playerSpritePosIdle = 1;
	this.playerSpritePos = this.playerSpritePosIdle;
	this.playerSpriteTickCounter = 0;
	this.ticksPerPlayerSpritePos = this.tickRate/this.playerSpriteFps;
	this.playerMoving = false;
	this.playerFacing = Math.PI / 2; // 0 radians means directly right, apparently
	
	var thisObj = this;
	this.canvas.addEventListener('click',function(ev){ thisObj.mouseClick(ev); },false);
	
	this.bgImage = new Image();
	this.bgImage.onload = function() { thisObj.draw(); };
	this.bgImage.src = 'alfy_bg.png';
	
	this.alfyImage = new Image();
	this.alfyImage.onload = function() { thisObj.draw(); };
	this.alfyImage.src = 'alfy_sprite.png';
}


Alfy.prototype.mouseClick = function( ev )
{
	var clickX;
	var clickY;
	if ( ev.pageX || ev.pageY )
	{ 
		clickX = ev.pageX;
		clickY = ev.pageY;
	}
	else
	{ 
		clickX = ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		clickY = ev.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	} 
	clickX -= this.canvas.offsetLeft;
	clickY -= this.canvas.offsetTop;
	var clickTileXY = this.translateToTileXY(clickX,clickY);
	this.setAlfyPath(clickTileXY[0],clickTileXY[1]);
}


// returns the tileX and tileY
Alfy.prototype.translateToTileXY = function( xPos, yPos )
{
	return new Array(Math.floor(xPos/this.tileSize),Math.floor(yPos/this.tileSize));
}


// returns the xPos and yPos of the top left of the tile
Alfy.prototype.tileXYPos = function( tileX, tileY )
{
	return new Array(tileX*this.tileSize,tileY*this.tileSize);
}


Alfy.prototype.isBlocking = function( tileX, tileY )
{	
	if ( tileX<0 || tileY<0 || tileX>=this.mapWidthInTiles || tileY>=this.mapHeightInTiles )
	{
		return true;
	}

	return this.blockingTiles[tileX] && this.blockingTiles[tileX][tileY]==true;
}


Alfy.prototype.tileIsOnMap = function( tileX, tileY )
{
	return tileX>=0 && tileX<=(this.mapWidthInTiles) && tileY>=0 && tileY<=(this.mapHeightInTiles);
}


Alfy.prototype.setColumnBlockingTiles = function( tileX, tileYs )
{
	this.blockingTiles[tileX] = new Array();
	for ( var i=0; i<tileYs.length; i++ )
	{
		this.blockingTiles[tileX][tileYs[i]] = true;
	}
}


// sets the path for Alfy to go to the given destination tile
Alfy.prototype.setAlfyPath = function( destTileX, destTileY )
{
	// clear the path
	this.playerPath = new Array();
	var playerTileXY = this.translateToTileXY(this.playerXPos,this.playerYPos);
	
	if ( (destTileX!=playerTileXY[0] || destTileY!=playerTileXY[1]) )
	{
		var xDiff = Math.max(playerTileXY[0],destTileX) - Math.min(playerTileXY[0],destTileX);
		var yDiff = Math.max(playerTileXY[1],destTileY) - Math.min(playerTileXY[1],destTileY);
		var fValue = xDiff + yDiff;
		
		var openList = new Array();
		var closedList = new Array();
		var currentAsTile = new this.AStarTile(playerTileXY[0],playerTileXY[1],destTileX,destTileY,null);
		openList[openList.length] = currentAsTile;

		var destinationAStarTile = null;
		var path = null;
		while ( openList.length>0 )
		{
			openList.sort(this.compareAStarTiles);
			currentAsTile = openList.shift();
			closedList[closedList.length] = currentAsTile;
			
			destinationAStarTile = this.aStarAddAdjacentTiles( currentAsTile, openList, closedList, destTileX, destTileY );
			if ( destinationAStarTile )
			{
				path = this.retraceAStarTilePath(destinationAStarTile);
			}
		}
		
		if ( path )
		{
			this.playerPath = path;
			this.playerMoving = true;
			this.start();
		}
	}
}


Alfy.prototype.AStarTile = function( tileX, tileY, destTileX, destTileY, prevTile )
{
	var squintyGValue = 1.4142; // hypotenuse for a common 45-45-90 triangle, apparently
	var straightGValue = 1;

	var xDiff = Math.max(tileX,destTileX) - Math.min(tileX,destTileX);
	var yDiff = Math.max(tileY,destTileY) - Math.min(tileY,destTileY);
	
	this.tileX = tileX;
	this.tileY = tileY;
	this.prevTile = prevTile;
	if ( prevTile )
	{
		this.gValue = ( tileX!=prevTile.tileX && tileY!=prevTile.tileY ) ? squintyGValue : straightGValue;
	}
	else
	{
		this.gValue = null;
	}
	this.hValue = xDiff + yDiff;
	this.fValue = this.hValue + this.gValue;
}


Alfy.prototype.compareAStarTiles = function( tileA, tileB )
{
	return tileA.fValue>tileB.fValue ? 1 : -1;
}


Alfy.prototype.aStarTileInArray = function( aStarTile, haystack )
{
	for ( var i=0; i<haystack.length; i++ )
	{
		if ( haystack[i].tileX==aStarTile.tileX && haystack[i].tileY==aStarTile.tileY )
		{
			return true;
		}
	}

	return false;
}


// returns the destination AStarTile if the destination was added, otherwise false
Alfy.prototype.aStarAddAdjacentTiles = function( aStarTile, openList, closedList, destTileX, destTileY )
{
	var minX = this.isBlocking(aStarTile.tileX-1,aStarTile.tileY) ? aStarTile.tileX : aStarTile.tileX-1;
	var minY = this.isBlocking(aStarTile.tileX,aStarTile.tileY-1) ? aStarTile.tileY : aStarTile.tileY-1;
	var maxX = this.isBlocking(aStarTile.tileX+1,aStarTile.tileY) ? aStarTile.tileX : aStarTile.tileX+1;
	var maxY = this.isBlocking(aStarTile.tileX,aStarTile.tileY+1) ? aStarTile.tileY : aStarTile.tileY+1;
	
	for ( xPos=minX; xPos<=maxX; xPos++ )
	{
		for ( yPos=minY; yPos<=maxY; yPos++ )
		{
			if ( !this.isBlocking(xPos,yPos) )
			{
				newAsTile = new this.AStarTile( xPos, yPos, destTileX, destTileY, aStarTile );
				if ( !this.aStarTileInArray(newAsTile,openList) && !this.aStarTileInArray(newAsTile,closedList) )
				{
					openList[openList.length] = newAsTile;
					if ( xPos==destTileX && yPos==destTileY )
					{
						return newAsTile;
					}
				}
			}
		}
	}
	
	return false;
}


Alfy.prototype.retraceAStarTilePath = function( aStarTile )
{
	var path = new Array();
	
	var currentTile = aStarTile;
	while ( currentTile.prevTile )
	{
		path[path.length] = currentTile;
		currentTile = currentTile.prevTile;
	}
	
	path.reverse();
	return path;
}


Alfy.prototype.startTicking = function()
{
	if ( !this.ticker )
	{
		var thisObj = this;
		this.ticker = setInterval(function(){thisObj.tick();},1000/this.tickRate);
	}
}


Alfy.prototype.stopTicking = function()
{
	if ( this.ticker )
	{
		clearInterval(this.ticker);
		this.ticker = null;
	}
}


Alfy.prototype.tick = function()
{
	if ( !this.ticking )
	{
		this.ticking = true;
		
		if ( this.playerMoving )
		{
			this.playerSpriteTickCounter++;
			if ( this.playerSpriteTickCounter>this.ticksPerPlayerSpritePos )
			{
				this.playerSpritePos = (this.playerSpritePos+1) % this.numPlayerSpritePositions;
				this.playerSpriteTickCounter = 0;
			}
			
		}
		
		var distanceRemaining = this.playerSpeed;
		while ( distanceRemaining>0 && this.playerPath.length>0 )
		{
			// move toward the next waypoint
			var waypoint = this.playerPath[0];
			var waypointXY = this.tileXYPos(waypoint.tileX,waypoint.tileY);
			var thisMove = this.movePlayerToward(waypointXY,distanceRemaining);
			distanceRemaining -= thisMove;
			
			// did we arrive at the waypoint?
			if ( this.playerXPos==waypointXY[0] && this.playerYPos==waypointXY[1] )
			{
				this.playerPath.shift();
			}
		}

		// did we arrive at the destination?
		if ( this.playerPath.length==0 )
		{
			this.playerMoving = false;
			this.stop();
		}


		this.ticking = false;
	}
}

Alfy.prototype.movePlayerToward = function( waypointXY, maxDistance )
{
	var dx = waypointXY[0] - this.playerXPos;
	var dy = waypointXY[1] - this.playerYPos;
	
	var distanceToWaypoint = Math.sqrt((dx*dx) + (dy*dy));
	var moveDistance = Math.min(distanceToWaypoint,maxDistance);
	var moveRatio = moveDistance/distanceToWaypoint;
	var moveX = moveRatio * dx;
	var moveY = moveRatio * dy;
	
	this.playerXPos += moveX;
	this.playerYPos += moveY;
	
	if ( Math.round(moveY)<0 )
	{
		this.playerFacing = 1.5 * Math.PI;
	}
	else if ( Math.round(moveX)<0 )
	{
		this.playerFacing = 1 * Math.PI;
	}
	else if ( Math.round(moveX)>0 )
	{
		this.playerFacing = 0;
	}
	else
	{
		this.playerFacing = 0.5 * Math.PI;
	}
	
	return moveDistance;
}


Alfy.prototype.start = function()
{
	this.startDrawing();
	this.startTicking();
}


Alfy.prototype.stop = function()
{
	this.stopTicking();
	this.stopDrawing();
}


Alfy.prototype.startDrawing = function()
{
	if ( !this.drawer )
	{
		var thisObj = this;
		this.drawer = setInterval(function(){thisObj.draw();},1000/this.tickRate);
	}
}


Alfy.prototype.stopDrawing = function()
{
	this.stopOnNextDraw = true;
}


Alfy.prototype.draw = function()
{
	if ( !this.drawing )
	{
		this.drawing = true;
		
		var context = this.canvas.getContext('2d');
		context.clearRect(0,0,this.canvas.width,this.canvas.height);
		context.fillStyle = '#000000';
		context.fillRect(0,0,this.canvas.width,this.canvas.height);
		
		var mapWidth = this.tileSize * this.mapWidthInTiles;
		var mapHeight = this.tileSize * this.mapHeightInTiles;
		if ( this.bgImage ) context.drawImage(this.bgImage,0,0,mapWidth,mapHeight,0,0,mapWidth,mapHeight);
		
		var effectivePSP = this.playerSpritePos==3 ? 1 : this.playerSpritePos;
		var sourceX = effectivePSP * this.tileSize;
		var sourceY = 0;
		if ( this.playerFacing>=(1.75*Math.PI) || this.playerFacing<=(0.25*Math.PI) )
		{
			sourceY = this.tileSize * 2;
		}
		else if ( this.playerFacing>(1.25*Math.PI) )
		{
			sourceY = this.tileSize * 3;
		}
		else if ( this.playerFacing>=(0.75*Math.PI) )
		{
			sourceY = this.tileSize * 1;
		}		
		if ( this.alfyImage ) context.drawImage(this.alfyImage,sourceX,sourceY,this.tileSize,this.tileSize,this.playerXPos,this.playerYPos,this.tileSize,this.tileSize);
		
		// Border
		context.lineWidth = 2;
		context.strokeStyle = "rgb(0,0,0)";
		context.strokeRect(0,0,this.canvas.width,this.canvas.height);
		
		if ( this.stopOnNextDraw && this.drawer )
		{
			clearInterval(this.drawer);
			this.drawer = null;
			this.stopOnNextDraw = false;
		}
		
		this.drawing = false;
	}
}

