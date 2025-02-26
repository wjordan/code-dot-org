/**
 * Utilities for initializing Circuit Playground board components with APIs
 * conforming to Maker API droplet blocks.
 */

import {
  N_COLOR_LEDS,
  CP_COMMAND,
  CP_ACCEL_STREAM_ON,
} from './PlaygroundConstants';
import _ from 'lodash';
import five from '@code-dot-org/johnny-five';
import PlaygroundIO from 'playground-io';
import PlaygroundButton from './Button';
import PlaygroundThermometer from './Thermometer';
import TouchSensor from './TouchSensor';
import Piezo from './Piezo';
import NeoPixel from './NeoPixel';
import Led from './Led';
import Switch from './Switch';

/**
 * Initializes a set of Johnny-Five component instances for the currently
 * connected Circuit Playground board.
 *
 * @param {five.Board} board - the johnny-five board object that needs new
 *        components initialized.
 * @returns {Promise.<Object.<String, Object>>} board components
 */
export function createCircuitPlaygroundComponents(board) {
  // Must initialize sound sensor BEFORE left button, otherwise left button
  // will not respond to input.  This has something to do with them sharing
  // pin 4 on the board.
  return Promise.all([
    initializeSoundSensor(board),
    initializeLightSensor(board),
    initializeThermometer(board),
  ]).then(([soundSensor, lightSensor, tempSensor]) => {
    return {
      colorLeds: initializeColorLeds(board),

      led: new Led({board, pin: 13}),

      toggleSwitch: new Switch(board),

      buzzer: new Piezo({
        board,
        pin: 5,
        controller: PlaygroundIO.Piezo,
      }),

      soundSensor,

      lightSensor,

      tempSensor,

      accelerometer: initializeAccelerometer(board),

      buttonL: new PlaygroundButton({board, pin: 4}),

      buttonR: new PlaygroundButton({board, pin: 19}),
    };
  });
}

/**
 * De-initializes any Johnny-Five components that might have been created
 * by createCircuitPlaygroundComponents
 * @param {Object} components - map of components, as originally returned by
 *   createCircuitPlaygroundComponents.  This object will be mutated: Destroyed
 *   components will be removed. Additional members of this object will be
 *   ignored.
 * @param {boolean} shouldDestroyComponents - whether or not to fully delete the
 *   components, or just reset to their initial state.
 */
export function cleanupCircuitPlaygroundComponents(
  components,
  shouldDestroyComponents
) {
  if (components.colorLeds) {
    components.colorLeds.forEach(led => {
      led.color('white');
      led.intensity(100);
      led.off();
    });
  }

  if (components.led) {
    components.led.intensity(0);
    components.led.off();
  }

  if (components.buzzer) {
    components.buzzer.off();
    components.buzzer.stop();
  }

  //Disable and clear sensors
  if (components.soundSensor) {
    components.soundSensor.disable();
    components.soundSensor._events = {};
  }

  if (components.lightSensor) {
    components.lightSensor.disable();
    components.lightSensor._events = {};
  }

  if (components.tempSensor) {
    components.tempSensor.disable();
    components.tempSensor._events = {};
  }

  if (components.accelerometer) {
    components.accelerometer.stop();
    components.accelerometer._events = {};
  }
  if (shouldDestroyComponents) {
    delete components.colorLeds;
    delete components.led;
    delete components.toggleSwitch;
    delete components.buzzer;
    delete components.soundSensor;
    delete components.lightSensor;
    delete components.tempSensor;
    delete components.accelerometer;
    delete components.buttonL;
    delete components.buttonR;
  }
}

/**
 * Re-initializes sensor components and accelerometer
 * @param {Object} components - map of components, as originally returned by
 *   createCircuitPlaygroundComponents.
 */
export function enableCircuitPlaygroundComponents(components) {
  if (components.soundSensor) {
    components.soundSensor.enable();
  }

  if (components.lightSensor) {
    components.lightSensor.enable();
  }

  if (components.tempSensor) {
    components.tempSensor.enable();
  }

  if (components.accelerometer) {
    components.accelerometer.start();
  }
}

/**
 * Set of classes used by interpreter to understand the type of instantiated
 * objects, allowing it to make methods and properties of instances available.
 */
export const componentConstructors = {
  Led,
  Board: five.Board,
  NeoPixel,
  PlaygroundButton,
  Switch,
  Piezo,
  Sensor: five.Sensor,
  Thermometer: five.Thermometer,
  Pin: five.Pin,
  Accelerometer: five.Accelerometer,
  Animation: five.Animation,
  /**
   * @link https://en.wikipedia.org/wiki/Three_Laws_of_Robotics
   * 1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.
   * 2. A robot must obey orders given it by human beings except where such orders would conflict with the First Law.
   * 3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.
   */
  Servo: five.Servo,
  TouchSensor,
};

function initializeColorLeds(board) {
  return _.range(N_COLOR_LEDS).map(i => initializeColorLed(board, i));
}

function initializeColorLed(board, pin) {
  return new NeoPixel({
    board,
    controller: PlaygroundIO.Pixel,
    pin,
  });
}

function initializeSoundSensor(board) {
  return new Promise(resolve => {
    const sensor = new five.Sensor({
      board,
      pin: 'A4',
      freq: 100,
    });
    addSensorFeatures(five.Board.fmap, sensor);
    sensor.once('data', () => resolve(sensor));
  });
}

function initializeLightSensor(board) {
  return new Promise(resolve => {
    const sensor = new five.Sensor({
      board,
      pin: 'A5',
      freq: 100,
    });
    addSensorFeatures(five.Board.fmap, sensor);
    sensor.once('data', () => resolve(sensor));
  });
}

/**
 * Set scale for setScale block, which records for later use to a five.Sensor instance.
 * @param {five.Board.fmap} fmap mapping function
 * @param {five.Sensor} sensor
 */
function addSensorFeatures(fmap, sensor) {
  /**
   * Cache scale setting locally (cannot grab after the fact from five.Sensor).
   * Scale is a 2-element array of [low, high].
   * @type {Array.<number>|undefined}
   */
  sensor.setScale = (low, high) => {
    sensor.scale(low, high);
  };
}

function initializeThermometer(board) {
  return new Promise(resolve => {
    const thermometer = new five.Thermometer({
      board,
      controller: PlaygroundThermometer,
      pin: 'A0',
      freq: 100,
    });
    thermometer.once('data', () => resolve(thermometer));
  });
}

function initializeAccelerometer(board) {
  const accelerometer = new five.Accelerometer({
    board,
    controller: PlaygroundIO.Accelerometer,
  });
  accelerometer.start = function () {
    accelerometer.io.sysexCommand([CP_COMMAND, CP_ACCEL_STREAM_ON]);
  };
  accelerometer.getOrientation = function (orientationType) {
    if (undefined === orientationType) {
      return [
        accelerometer.getOrientation('x'),
        accelerometer.getOrientation('y'),
        accelerometer.getOrientation('z'),
      ];
    }

    // Accelerometer on the express board is rotated 90 degrees from classic board.
    // Conditional ensures consistent output of 'pitch'/'roll' across both boards
    if (board.isExpressBoard) {
      if (orientationType === 'pitch') {
        return accelerometer['roll'];
      } else if (orientationType === 'roll') {
        return -1 * accelerometer['pitch'];
      }
    }
    return accelerometer[orientationType];
  };
  accelerometer.getAcceleration = function (accelerationDirection) {
    if (undefined === accelerationDirection) {
      return [
        accelerometer.getAcceleration('x'),
        accelerometer.getAcceleration('y'),
        accelerometer.getAcceleration('z'),
      ];
    }
    if (accelerationDirection === 'total') {
      return accelerometer.acceleration;
    }
    return accelerometer[accelerationDirection];
  };
  return accelerometer;
}
