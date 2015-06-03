var alfyWorldInstance = null;

// argument
function AlfyWorld( maxFps )
{
	this.canvas = document.getElementById('alfy_world_canvas');
	this.canvas.style.cursor = "pointer";
	this.ctx = this.canvas.getContext('2d');
	
	if ( !maxFps )
	{
		maxFps = 50;
	}
	
	this.ticking = false;
	this.tickTime = 20;
	this.ticker = null;
	this.tick = alfyWorldTick;
	this.startTicking = alfyWorldStartTicking;
	this.stopTicking = alfyWorldStopTicking;
	
	this.drawing = false;
	this.drawTime = 1000 / maxFps;
	this.drawer = null;
	this.draw = alfyWorldDraw;
	this.startDrawing = alfyWorldStartDrawing;
	this.stopDrawing = alfyWorldStopDrawing;
	
	this.mouseDown = alfyWorldMouseDown;
	this.mouseMove = alfyWorldMouseMove;
	this.mouseUp = alfyWorldMouseUp;
	
	this.touchDown = alfyWorldTouchDown;
	this.touchMove = alfyWorldTouchMove;
	this.touchUp = alfyWorldTouchUp;
	
	// listeners
	var self = this;
	this.mouseIsDown = false;
	this.canvas.addEventListener('mousedown',function(ev){self.mouseDown(ev);},false);
	window.addEventListener('mousemove',function(ev){self.mouseMove(ev);},false);
	window.addEventListener('mouseup',function(ev){self.mouseUp(ev);},false);
	
	this.canvas.addEventListener('touchstart',function(ev){self.touchDown(ev);},false);
	window.addEventListener('touchmove',function(ev){self.touchMove(ev);},false);
	this.canvas.addEventListener('touchend',function(ev){self.touchUp(ev);},false);
	window.addEventListener('touchcancel',function(ev){self.touchUp(ev);},false);
	
	this.viewX = 0; // viewX and viewY are where the view is currently centered. It starts centered on the player
	this.viewY = 0;
	this.viewRelativeX = Math.ceil(this.canvas.width/2); // the distance from the center of the view to the top left of the canvas
	this.viewRelativeY = Math.ceil(this.canvas.height/2);
	this.player = new Alfy(this,0,0);
	
	this.translateToViewX = alfyWorldTranslateToViewX;
	this.translateToViewY = alfyWorldTranslateToViewY;
	this.translateToWorldX = alfyWorldTranslateToWorldX;
	this.translateToWorldY = alfyWorldTranslateToWorldY;
	
	this.grassSpriteWidth = 32;
	this.grassSpriteHeight = 32;
	this.grassSprite = new Image();
	this.grassSprite.onload = function() { self.draw(); };
	this.grassSprite.src = 'grass_sprite.png';
	
	// initial draw
	this.draw();
}


function alfyWorldTranslateToViewX( worldX )
{
	return worldX - this.viewX + this.viewRelativeX;
}

function alfyWorldTranslateToViewY( worldY )
{
	return worldY - this.viewY + this.viewRelativeY;
}

function alfyWorldTranslateToWorldX( viewX )
{
	return viewX - this.viewX - this.viewRelativeX;
}

function alfyWorldTranslateToWorldY( viewY )
{
	return viewY - this.viewY - this.viewRelativeY;
}


function alfyWorldStartDrawing()
{
	if ( !this.drawer )
	{
		var self = this;
		this.drawer = setInterval(function(){self.draw();},this.drawTime);
	}
}


function alfyWorldStopDrawing()
{
	if ( this.drawer )
	{
		clearInterval(this.drawer);
		this.drawer = null;
	}
	
	// one final draw - just so we get the last state!
	this.draw();
}


function alfyWorldStartTicking()
{
	if ( !this.ticker )
	{
		var self = this;
		this.ticker = setInterval(function(){self.tick();},this.tickTime);
	}
}


function alfyWorldStopTicking()
{
	if ( this.ticker )
	{
		clearInterval(this.ticker);
		this.ticker = null;
	}
}


function alfyWorldTouchDown( ev )
{
	ev.preventDefault();
	this.mouseIsDown = true;
	this.touchMove(ev);
	
	return false;
}



function alfyWorldTouchMove( ev )
{
	if ( this.mouseIsDown )
	{
		ev.preventDefault();
		clickX = ev.targetTouches[0].pageX - this.canvas.offsetLeft;
		clickY = ev.targetTouches[0].pageY - this.canvas.offsetTop;
		var worldX = this.translateToWorldX(clickX);
		var worldY = this.translateToWorldY(clickY);
		this.player.setDestination(worldX,worldY);
	}
}


function alfyWorldTouchUp( ev )
{
	this.mouseIsDown = false;
	this.player.clearDestination();
}


function alfyWorldMouseDown( ev )
{
	ev.preventDefault();
	this.mouseIsDown = true;
	this.mouseMove(ev);
	document.body.style.cursor = "pointer";
	return false;
}


function alfyWorldMouseMove( ev )
{
	if ( this.mouseIsDown )
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
		
		var worldX = this.translateToWorldX(clickX);
		var worldY = this.translateToWorldY(clickY);
		this.player.setDestination(worldX,worldY);
	}
}


function alfyWorldMouseUp( ev )
{
	this.mouseIsDown = false;
	this.player.clearDestination();
	document.body.style.cursor = "default";
}


function alfyWorldTick()
{
	if ( !this.ticking )
	{
		this.ticking = true;
		this.player.tick();
		this.ticking = false;
	}
}


function alfyWorldDraw()
{
	if ( !this.drawing )
	{
		this.drawing = true;
		
		this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		
		var tileX = 0;
		var tileY = 0;
		while ( tileX<this.canvas.width )
		{
			while ( tileY<this.canvas.height )
			{
				this.ctx.drawImage(this.grassSprite,0,0,this.grassSpriteWidth,this.grassSpriteHeight,tileX,tileY,this.grassSpriteWidth,this.grassSpriteHeight);
				tileY += this.grassSpriteHeight;
			}
			tileY = 0;
			tileX += this.grassSpriteWidth;
		}
		
		
		this.player.draw();
		
		// Border
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "rgb(0,0,0)";
		this.ctx.strokeRect(0,0,this.canvas.width,this.canvas.height);
		
		this.drawing = false;
	}
}


function Alfy( alfyWorldInstance, xPos, yPos )
{
	this.sprite = new Image();
	this.sprite.onload = function() { alfyWorldInstance.draw };
	this.sprite.src = 'alfy_sprite.png';
	
	this.spriteWidth = 32;
	this.spriteHeight = 32;
	this.spriteFps = 8; // number of frames per second the sprite image cycles at when moving
	this.numSpritePositions = 3;
	this.spritePosIdle = 1;
	this.spritePos = this.spritePosIdle;
	this.spriteTickCounter = 0;
	var ticksPerSecond = 1000/alfyWorldInstance.tickTime;
	this.ticksPerSpritePos = ticksPerSecond/this.spriteFps;
	
	this.xPos = xPos;
	this.yPos = yPos;
	this.facing = Math.PI;
	this.moving = false;
	this.destX = null;
	this.destY = null;
	this.alfyWorldInstance = alfyWorldInstance;
	this.speed = this.alfyWorldInstance.tickTime / 10;
	this.setDestination = alfySetDestination;
	this.clearDestination = alfyClearDestination;
	this.tick = alfyTick;
	this.draw = alfyDraw;
}


function alfyClearDestination()
{
	this.destX = null;
	this.destY = null;
	this.moving = false;
	this.spritePos = this.spritePosIdle;
	this.alfyWorldInstance.stopTicking();
	this.alfyWorldInstance.stopDrawing();
}


function alfySetDestination( destX, destY )
{
	this.destX = destX;
	this.destY = destY;
	this.moving = true;
	this.alfyWorldInstance.startTicking();
	this.alfyWorldInstance.startDrawing();
}


function alfyTick()
{
	if ( this.moving )
	{
		this.spriteTickCounter++;
		if ( this.spriteTickCounter>this.ticksPerSpritePos )
		{
			this.spritePos = (this.spritePos+1) % this.numSpritePositions;
			this.spriteTickCounter = 0;
		}
		
	}

	if ( this.destX!=null && this.destY!=null )
	{
		var moveX = 0;
		var moveY = 0;
		var diffX = this.destX - this.xPos;
		var diffY = this.destY - this.yPos;
		if ( diffY==0 )
		{
			moveX = this.speed;
			this.facing = moveX>0 ? (0.5*Math.PI) : (1.5*Math.PI);
		}
		else if ( diffX==0 )
		{
			moveY = this.speed;
			this.facing = moveY>0 ? Math.PI : 0;
		}
		else
		{
			this.facing = Math.atan(diffY/diffX) + (0.5 * Math.PI) + ( diffX<0 ? Math.PI : 0 ); // 0 - 2*Pi, with 0 being the top
			
			var magDiffY = diffY<0 ? (-1*diffY) : diffY;
			var magDiffX = diffX<0 ? (-1*diffX) : diffX;
			var angle = Math.atan(magDiffY/magDiffX);
			var moveY = Math.sin(angle) * this.speed;
			var moveX = Math.cos(angle) * this.speed;
			
			moveY = diffY<0 ? (-1*moveY) : moveY;
			moveX = diffX<0 ? (-1*moveX) : moveX;
		}
		this.xPos += moveX;
		this.yPos += moveY;
		
		if ( Math.round(this.xPos)==Math.round(this.destX) && Math.round(this.yPos)==Math.round(this.destY) )
		{
			this.clearDestination();
		}
	}
}


function alfyDraw()
{
	var viewX = this.alfyWorldInstance.translateToViewX(this.xPos);
	var viewY = this.alfyWorldInstance.translateToViewY(this.yPos);
	var destX = viewX - (0.5*this.spriteWidth);
	var destY = viewY - (0.5*this.spriteHeight);
	var sourceX = this.spritePos * this.spriteWidth;
	var sourceY = 0;
	if ( this.facing>(1.75*Math.PI) || this.facing<(0.25*Math.PI) )
	{
		sourceY = this.spriteHeight * 3;
	}
	else if ( this.facing>(1.25*Math.PI) )
	{
		sourceY = this.spriteHeight * 1;
	}
	else if ( this.facing<(0.75*Math.PI) )
	{
		sourceY = this.spriteHeight * 2;
	}
	
	this.alfyWorldInstance.ctx.drawImage(this.sprite,sourceX,sourceY,this.spriteWidth,this.spriteHeight,destX,destY,this.spriteWidth,this.spriteHeight);
}