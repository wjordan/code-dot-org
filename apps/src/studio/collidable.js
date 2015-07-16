/**
 * Blockly App: Studio
 *
 * Copyright 2014 Code.org
 *
 */

'use strict';

var studioApp = require('../StudioApp').singleton;
var Direction = require('./constants').Direction;
var utils = require('../utils');
var _ = utils.getLodash();

//
// Collidable constructor
//
// opts.image (URL)
// opts.width (pixels)
// opts.height (pixels)
// opts.x
// opts.y
// opts.dir (direction)
// opts.speed (speed)
// opts.frames
//

var Collidable = function (opts) {
  for (var prop in opts) {
    this[prop] = opts[prop];
  }
  this.visible = this.visible || true;
  this.flags = 0;
  // hash table of other sprites we're currently colliding with
  this.collidingWith_ = {};

  // default num frames is 1
  this.frames = this.frames || 1;
};

module.exports = Collidable;

/**
 * Clear all current collisions
 */
Collidable.prototype.clearCollisions = function () {
  this.collidingWith_ = {};
};

/**
 * Mark that we're colliding with object represented by key
 * @param key A unique key representing the object we're colliding with
 * @returns {boolean} True if collision is started, false if we're already colliding
 */
Collidable.prototype.startCollision = function (key) {
  if (this.isCollidingWith(key)) {
    return false;
  }

  this.collidingWith_[key] = true;
  return true;
};

/**
 * Mark that we're no longer colliding with object represented by key
 * @param key A unique key representing the object we're querying
 */
Collidable.prototype.endCollision = function (key) {
  this.collidingWith_[key] = false;
};

/**
 * Are we colliding with the object represented by key?
 * @param key A unique key representing the object we're querying
 */
Collidable.prototype.isCollidingWith = function (key) {
  return this.collidingWith_[key] === true;
};

Collidable.prototype.bounce = function () {
  //console.log("bounce");
  switch (this.dir) {
    case Direction.NORTH:
      this.dir = Direction.SOUTH;
      break;
    case Direction.WEST:
      this.dir = Direction.EAST;
      break;
    case Direction.SOUTH:
      this.dir = Direction.NORTH;
      break;
    case Direction.EAST:
      this.dir = Direction.WEST;
      break;
    case Direction.NORTHEAST:
      this.dir = Direction.SOUTHWEST;
      break;
    case Direction.SOUTHEAST:
      this.dir = Direction.NORTHWEST;
      break;
    case Direction.SOUTHWEST:
      this.dir = Direction.NORTHEAST;
      break;
    case Direction.NORTHWEST:
      this.dir = Direction.SOUTHEAST;
      break;
  }
};

Collidable.prototype.chase = function() {
  //console.log("chase");
  var sprite = Studio.sprite[0];

  if (this.x > sprite.x + 20) {
    this.dir = Direction.WEST;
  }
  else if (this.x < sprite.x - 20) {
    this.dir = Direction.EAST;
  }
  else if (this.y < sprite.y - 20) {
    this.dir = Direction.SOUTH;
  }
  else if (this.y > sprite.y + 20) {
    this.dir = Direction.NORTH;
  }
  else {
    this.dir = Direction.NONE;
  }
}

Collidable.prototype.chaseSmart = function() {
  //console.log("chase");
  var sprite = Studio.sprite[0];

  this.dir = Direction.NONE;

  if (Math.abs(this.x - sprite.x) > Math.abs(this.y - sprite.y)) {
    if (this.x > sprite.x + 20) {
      this.dir = Direction.WEST;
    }
    else if (this.x < sprite.x - 20) {
      this.dir = Direction.EAST;
    }
  } else {
    if (this.y < sprite.y - 20) {
      this.dir = Direction.SOUTH;
    }
    else if (this.y > sprite.y + 20) {
      this.dir = Direction.NORTH;
    }
  }
}

Collidable.prototype.chaseFree_old = function() {

  // don't look every frames
  if (this.framesSinceLook < 20) {
    this.framesSinceLook ++;
    return;
  }

  //console.log("chaseFree start");

  this.framesSinceLook = 0;

  do {
    //console.log("chase");
    var sprite = Studio.sprite[0];

    this.dir = Direction.NONE;

    if (Math.abs(this.x - sprite.x) > Math.abs(this.y - sprite.y)) {
      if (this.x > sprite.x + 20) {
        this.dir = Direction.WEST;
      }
      else if (this.x < sprite.x - 20) {
        this.dir = Direction.EAST;
      }
    } else {
      if (this.y < sprite.y - 20) {
        this.dir = Direction.SOUTH;
      }
      else if (this.y > sprite.y + 20) {
        this.dir = Direction.NORTH;
      }
    }

    var moveBlocked = false;
    var next = this.getNextPosition();
    if (Studio.willCollidableTouchWall(this, next.x, next.y)) {
      Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
      this.roam();
      return;
      moveBlocked = true;
    }
  } while(moveBlocked);

}


Collidable.prototype.chaseFree = function() {

  // If we're going to hit a wall, then just roam away from it instead.

  var next = this.getNextPosition();
  if (Studio.willCollidableTouchWall(this, next.x, next.y)) {
    Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
    this.roamImmediate();
    this.framesSinceLook = 0;
  }

  //console.log("chaseFree start");


  // Otherwise, take 15 updates before we re-decide our direciton.

  if (this.framesSinceLook < 15)
  {
    this.framesSinceLook ++;
    return;
  }

  this.framesSinceLook = 0;



  // Chase the good guy.

  do {
    //console.log("chase");
    var sprite = Studio.sprite[0];

    var spriteX = sprite.x + sprite.width/2;
    var spriteY = sprite.y + sprite.height/2;

    this.dir = Direction.NONE;

    if (Math.abs(this.x - spriteX) > Math.abs(this.y - spriteY)) {
      if (this.x > spriteX + 20) {
        this.dir = Direction.WEST;
      }
      else if (this.x < spriteX - 20) {
        this.dir = Direction.EAST;
      }
    } else {
      if (this.y < spriteY - 20) {
        this.dir = Direction.SOUTH;
      }
      else if (this.y > spriteY + 20) {
        this.dir = Direction.NORTH;
      }
    }
    
    var moveBlocked = false;

    Studio.drawCollisionSquare("spriteForChaseFree", spriteX, spriteY, 3, 3);
    Studio.drawCollisionSquare("itemForChaseFree", this.x, this.y, 3, 3);

    /*
    var next = this.getNextPosition();
    if (Studio.willCollidableTouchWall(this, next.x, next.y)) {
      Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
      this.roam();
    }*/
  } while(moveBlocked);

}

Collidable.prototype.fleeFree = function() {

  // If we're going to hit a wall, then just roam away from it instead.

  var next = this.getNextPosition();
  if (Studio.willCollidableTouchWall(this, next.x, next.y) ||
      Studio.willCollidableLeaveArea(this, next.x, next.y)) {
    Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
    this.roamImmediate();
    this.framesSinceLook = 0;
  }

  //console.log("chaseFree start");


  // Otherwise, take 15 updates before we re-decide our direciton.

  if (this.framesSinceLook < 15)
  {
    this.framesSinceLook ++;
    return;
  }

  this.framesSinceLook = 0;

  // Flee the good guy.

  do {
    //console.log("chase");
    var sprite = Studio.sprite[0];

    this.dir = Direction.NONE;

    if (Math.abs(this.x - sprite.x) > Math.abs(this.y - sprite.y)) {
      if (this.x > sprite.x + 20) {
        this.dir = Direction.EAST;
      }
      else if (this.x < sprite.x - 20) {
        this.dir = Direction.WEST;
      }
    } else {
      if (this.y < sprite.y - 20) {
        this.dir = Direction.NORTH;
      }
      else if (this.y > sprite.y + 20) {
        this.dir = Direction.SOUTH;
      }
    }
    
    var moveBlocked = false;

    /*
    var next = this.getNextPosition();
    if (Studio.willCollidableTouchWall(this, next.x, next.y)) {
      Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
      this.roam();
    }*/
  } while(moveBlocked);

}

Collidable.prototype.chaseSmartInterval = function() {
  //console.log("chase");
  var sprite = Studio.sprite[0];

  this.dir = Direction.NONE;

  if (Math.abs(this.x - sprite.x) > Math.abs(this.y - sprite.y)) {
    if (this.x > sprite.x + 20) {
      this.dir = Direction.WEST;
    }
    else if (this.x < sprite.x - 20) {
      this.dir = Direction.EAST;
    }
  } else {
    if (this.y < sprite.y - 20) {
      this.dir = Direction.SOUTH;
    }
    else if (this.y > sprite.y + 20) {
      this.dir = Direction.NORTH;
    }
  }
}

Collidable.prototype.fleeSmart = function() {
  //console.log("chase");
  var sprite = Studio.sprite[0];

  this.dir = Direction.NONE;

  if (Math.abs(this.x - sprite.x) > Math.abs(this.y - sprite.y)) {
    if (this.x > sprite.x + 20) {
      this.dir = Direction.EAST;
    }
    else if (this.x < sprite.x - 20) {
      this.dir = Direction.WEST;
    }
  } else {
    if (this.y < sprite.y - 20) {
      this.dir = Direction.NORTH;
    }
    else if (this.y > sprite.y + 20) {
      this.dir = Direction.SOUTH;
    }
  }
}

Collidable.prototype.roam = function() {
  console.log("roam start");

  var directions = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];
  directions = _.without(directions, this.dir);
  var r = Math.floor(Math.random() * 3) + 0;
  this.dir = directions[r];

  /*
  var r = Math.floor(Math.random() * 4) + 0;
  switch(r) {
    case 0:
      this.dir = Direction.NORTH;
      break;
    case 1:
      this.dir = Direction.SOUTH;
      break;
    case 2:
      this.dir = Direction.EAST;
      break;
    case 3:
      this.dir = Direction.WEST;
      break;
  } */
}

Collidable.prototype.roamFree = function() {
  console.log("roamFree start");

  // If we're going to hit a wall right away, then immediately roam elsewhere.

  var next = this.getNextPosition();
  if (Studio.willCollidableTouchWall(this, next.x, next.y) ||
      Studio.willCollidableLeaveArea(this, next.x, next.y)) {
    Studio.drawCollisionSquare("chaseFreeCollision", next.x, next.y, 10, 10);
    this.roamImmediate();
    this.framesSinceLook = 0;
  }

  // don't look every frame
  if (this.framesSinceLook < 20) {
    this.framesSinceLook ++;
    return;
  }

  this.roamImmediate();
}


Collidable.prototype.roamImmediate = function() {
  console.log("roamFree start");

  this.framesSinceLook = 0;

  // We get 10 attempts to find a valid direction that doesn't hit a wall.

  var attempts = 0;

  do {

    var directions = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];
    directions = _.without(directions, this.dir);
    var r = Math.floor(Math.random() * 3) + 0;
    this.dir = directions[r];

    var moveBlocked = false;
    var next = this.getNextPosition();
    if (Studio.willCollidableTouchWall(this, next.x, next.y) ||
        Studio.willCollidableLeaveArea(this, next.x, next.y)) {
      moveBlocked = true;
      console.log("  roamFree again");
    }
    attempts ++;

  } while(moveBlocked && attempts < 10);
}




Collidable.prototype.smartBounce = function() {
  //console.log("chase");
  var directions;
  if (Studio.lastItemCollisionTarget == 'top') {
    directions = [Direction.SOUTH, Direction.EAST, Direction.WEST];
  } else if (Studio.lastItemCollisionTarget == 'bottom') {
    directions = [Direction.NORTH, Direction.EAST, Direction.WEST];
  } else if (Studio.lastItemCollisionTarget == 'left') {
    directions = [Direction.NORTH, Direction.SOUTH, Direction.EAST];
  } else if (Studio.lastItemCollisionTarget == 'right') {
    directions = [Direction.NORTH, Direction.SOUTH, Direction.WEST];
  }

  var r = Math.floor(Math.random() * 3) + 0;
  this.dir = directions[r];

  /*
  var r = Math.floor(Math.random() * 4) + 0;
  switch(r) {
    case 0:
      this.dir = Direction.NORTH;
      break;
    case 1:
      this.dir = Direction.SOUTH;
      break;
    case 2:
      this.dir = Direction.EAST;
      break;
    case 3:
      this.dir = Direction.WEST;
      break;
  } */
}



/**
 * Assumes x/y are center coords (true for projectiles and items)
 * outOfBounds() returns true if the object is entirely "off screen"
 */
Collidable.prototype.outOfBounds = function () {
  return (this.x < -(this.width / 2)) ||
         (this.x > studioApp.MAZE_WIDTH + (this.width / 2)) ||
         (this.y < -(this.height / 2)) ||
         (this.y > studioApp.MAZE_HEIGHT + (this.height / 2));
};
