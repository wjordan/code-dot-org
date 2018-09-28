import * as assetPrefix from '../assetManagement/assetPrefix';
var GameLabWorld = require('./GameLabWorld');
import {createDanceAPI, teardown} from './DanceLabP5';

/**
 * An instantiable GameLabP5 class that wraps p5 and p5play and patches it in
 * specific places to enable GameLab functionality
 */
var GameLabP5 = function () {
  this.p5 = null;
  this.gameLabWorld = null;
  this.danceAPI = null;
  this.p5decrementPreload = null;
  this.p5eventNames = [
    'mouseMoved', 'mouseDragged', 'mousePressed', 'mouseReleased',
    'mouseClicked', 'mouseWheel',
    'keyPressed', 'keyReleased', 'keyTyped'
  ];
  this.p5specialFunctions = ['preload', 'draw', 'setup'].concat(this.p5eventNames);
  this.stepSpeed = 1;

  this.setLoop = (shouldLoop) => {
    if (!this.p5) {
      return;
    }
    if (shouldLoop) {
      // Calling p5.loop() invokes p5.draw(), but we might still be waiting for
      // animations to load.
      this.p5._loop = true;
    } else {
      this.p5.noLoop();
    }
  };
};

module.exports = GameLabP5;

GameLabP5.baseP5loadImage = null;

/**
 * Initialize this GameLabP5 instance.
 *
 * @param {!Object} options
 * @param {!Function} options.gameLab instance of parent GameLab object
 * @param {Number} [options.scale] Scale ratio of containing element (<1 is small)
 * @param {!Function} options.onExecutionStarting callback to run during p5 init
 * @param {!Function} options.onPreload callback to run during preload()
 * @param {!Function} options.onSetup callback to run during setup()
 * @param {!Function} options.onDraw callback to run during each draw()
 */
GameLabP5.prototype.init = function (options) {

  this.onExecutionStarting = options.onExecutionStarting;
  this.onPreload = options.onPreload;
  this.onSetup = options.onSetup;
  this.onDraw = options.onDraw;
  this.scale = options.scale || 1;

  // Override p5.loadImage so we can modify the URL path param
  if (!GameLabP5.baseP5loadImage) {
    GameLabP5.baseP5loadImage = window.p5.prototype.loadImage;
    window.p5.prototype.loadImage = function (path) {
      // Make sure to pass all arguments through to loadImage, which can get
      // wrapped and take additional arguments during preload.
      arguments[0] = assetPrefix.fixPath(path);
      return GameLabP5.baseP5loadImage.apply(this, arguments);
    };
  }

  // Create 2nd phase function afterUserDraw()
  window.p5.prototype.afterUserDraw = function () {
    /*
     * Copied code from p5 from redraw()
     */
    const postMethods = this._registeredMethods.post;
    for (let i = 0; i < postMethods.length; i++) {
      postMethods[i].call(this);
    }
  };
};

/**
 * Reset GameLabP5 to its initial state. Called before each time it is used.
 */
GameLabP5.prototype.resetExecution = function () {
  teardown();

  if (this.p5) {
    this.p5.remove();
    this.p5 = null;
    this.p5decrementPreload = null;
    this.gameLabWorld = null;
  }
};

/**
 * Register a p5 event handler function. The provided function replaces the
 * method stored on our p5 instance.
 */
GameLabP5.prototype.registerP5EventHandler = function (eventName, handler) {
  this.p5[eventName] = handler;
};

/**
 * Instantiate a new p5 and start execution
 */
GameLabP5.prototype.startExecution = function (dancelab) {
  new window.p5(function (p5obj) {
      this.p5 = p5obj;
      // Tell p5.play that we don't want it to have Sprite do anything
      // within _syncAnimationSizes()
      this.p5._fixedSpriteAnimationFrameSizes = true;

      this.gameLabWorld = new GameLabWorld(p5obj);
      if (dancelab) {
        this.danceAPI = createDanceAPI(this.p5);
      }

      p5obj._setupEpiloguePhase1 = function () {
        /*
         * Modified code from p5 _setup() (safe to call multiple times in the
         * event that the debugger has slowed down the process of completing
         * the setup phase)
         */

        // unhide any hidden canvases that were created
        var canvases = document.getElementsByTagName('canvas');
        for (var i = 0; i < canvases.length; i++) {
          var k = canvases[i];
          if (k.dataset.hidden === 'true') {
            k.style.visibility = '';
            delete(k.dataset.hidden);
          }
        }
      }.bind(p5obj);

      p5obj._setupEpiloguePhase2 = function () {
        /*
         * Modified code from p5 _setup()
         */
        this._setupDone = true;

      }.bind(p5obj);

      p5obj.preload = function () {
        this.onPreload();
      }.bind(this);

      p5obj.setup = function () {
        this.onSetup();
      }.bind(this);

      p5obj.draw = this.onDraw.bind(this);

      this.onExecutionStarting();

    }.bind(this),
    'divGameLab');
};

GameLabP5.prototype.notifyKeyCodeDown = function (keyCode) {
  // Synthesize an event and send it to the internal p5 handler for keydown
  if (this.p5) {
    this.p5._onkeydown({ which: keyCode });
  }
};

GameLabP5.prototype.notifyKeyCodeUp = function (keyCode) {
  // Synthesize an event and send it to the internal p5 handler for keyup
  if (this.p5) {
    this.p5._onkeyup({ which: keyCode });
  }
};

GameLabP5.prototype.getCustomMarshalGlobalProperties = function () {
  return {
    width: this.p5,
    height: this.p5,
    displayWidth: this.p5,
    displayHeight: this.p5,
    windowWidth: this.p5,
    windowHeight: this.p5,
    focused: this.p5,
    frameCount: this.p5,
    keyIsPressed: this.p5,
    key: this.p5,
    keyCode: this.p5,
    mouseX: this.p5,
    mouseY: this.p5,
    pmouseX: this.p5,
    pmouseY: this.p5,
    winMouseX: this.p5,
    winMouseY: this.p5,
    pwinMouseX: this.p5,
    pwinMouseY: this.p5,
    mouseButton: this.p5,
    mouseIsPressed: this.p5,
    touchX: this.p5,
    touchY: this.p5,
    ptouchX: this.p5,
    ptouchY: this.p5,
    touches: this.p5,
    touchIsDown: this.p5,
    pixels: this.p5,
    deviceOrientation: this.p5,
    accelerationX: this.p5,
    accelerationY: this.p5,
    accelerationZ: this.p5,
    pAccelerationX: this.p5,
    pAccelerationY: this.p5,
    pAccelerationZ: this.p5,
    rotationX: this.p5,
    rotationY: this.p5,
    rotationZ: this.p5,
    pRotationX: this.p5,
    pRotationY: this.p5,
    pRotationZ: this.p5,
    leftEdge: this.p5,
    rightEdge: this.p5,
    topEdge: this.p5,
    bottomEdge: this.p5,
    edges: this.p5
  };
};

GameLabP5.prototype.getCustomMarshalBlockedProperties = function () {
  return [];
};

GameLabP5.prototype.getCustomMarshalObjectList = function () {
  return [
    { instance: GameLabWorld },
    {
      instance: this.p5.Sprite,
      ensureIdenticalMarshalInstances: true,
      methodOpts: {
        nativeCallsBackInterpreter: true
      }
    },
    // The p5play Group object should be custom marshalled, but its constructor
    // actually creates a standard Array instance with a few additional methods
    // added. We solve this by putting "Array" in this list, but with "draw" as
    // a requiredMethod:
    {
      instance: Array,
      requiredMethod: 'draw',
      methodOpts: {
        nativeCallsBackInterpreter: true
      }
    },
    { instance: window.p5 },
    { instance: this.p5.Camera },
    { instance: this.p5.Animation },
    { instance: this.p5.SpriteSheet },
    { instance: window.p5.Vector },
    { instance: window.p5.Color },
    { instance: window.p5.Image },
    { instance: window.p5.Renderer },
    { instance: window.p5.Graphics },
    { instance: window.p5.Font },
    { instance: window.p5.Table },
    { instance: window.p5.TableRow },
    // TODO: Maybe add collider types here?
  ];
};

/**
 * Names every property on the p5 instance except for those on custom marshal
 * lists or blacklisted properties.
 * @returns {Array.<string>}
 */
GameLabP5.prototype.getMarshallableP5Properties = function () {
  const globalCustomMarshalProps = this.getCustomMarshalGlobalProperties();

  const propNames = [];
  for (const prop in this.p5) {
    if (
        -1 === this.p5specialFunctions.indexOf(prop) &&
        !globalCustomMarshalProps[prop]) {
      propNames.push(prop);
    }
  }
  return propNames;
};

GameLabP5.prototype.getGlobalPropertyList = function () {
  const propList = {};

  // Include every property on the p5 instance in the global property list
  // except those on the custom marshal lists:
  const p5PropertyNames = this.getMarshallableP5Properties();
  for (const prop of p5PropertyNames) {
    propList[prop] = [this.p5[prop], this.p5];
  }

  // Create a 'p5' object in the global namespace:
  propList.p5 = [this.p5, window];

  // Create a 'Game' object in the global namespace
  // to make older blocks compatible:
  propList.Game = [this.gameLabWorld, this];

  // Create a 'World' object in the global namespace:
  propList.World = [this.gameLabWorld, this];

  if (this.danceAPI) {
    // Create a 'Dance' object in the global namespace:
    propList.Dance = [this.danceAPI, this];
  }

  return propList;
};

/**
 * Return the current frame rate
 */
GameLabP5.prototype.getFrameRate = function () {
  return this.p5 ? this.p5.frameRate() : 0;
};

/**
 * Mark all current and future sprites as debug=true.
 * @param {boolean} debugSprites - Enable or disable debug flag on all sprites
 */
GameLabP5.prototype.debugSprites = function (debugSprites) {
  if (this.p5) {
    this.p5.allSprites.forEach(sprite => {
      sprite.debug = debugSprites;
    });
  }
};

GameLabP5.prototype.afterDrawComplete = function () {
  this.p5.afterUserDraw();
};

/**
 * Setup has started and the debugger may be at a breakpoint. Run Phase1 of
 * of the epilogue so the student can see what they may be drawing in their
 * setup code while debugging.
 */
GameLabP5.prototype.afterSetupStarted = function () {
  this.p5._setupEpiloguePhase1();
};

/**
 * Setup has completed. Run Phase1 and Phase2 of the epilogue. It is safe to
 * call _setupEpiloguePhase1() multiple times in the event that it may already
 * have been called.
 */
GameLabP5.prototype.afterSetupComplete = function () {
  this.p5._setupEpiloguePhase1();
  this.p5._setupEpiloguePhase2();
};

/**
 * Reset just the world object without reloading the rest of p5
 */
GameLabP5.prototype.resetWorld = function () {
  if (!this.p5) {
    return;
  }
  this.gameLabWorld = new GameLabWorld(this.p5);
};
