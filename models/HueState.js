'use strict';

var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var log = require('../log');

var hueStateSchema = new Schema({
  lights: {},
  groups: {},
  config: {},
  schedules: {}
});

/** 
 * Whitelist Cache
 */

var whitelistCache;

var updateWhitelistCache = function updateWhitelistCache(HueState, cb) {
  HueState.findOne(function (err, state) {
    if (err) {
      log.error(err);
    }
    if (state) {
      whitelistCache = _.keys(state.config.whitelist);
    }
    else {
      log.error({error:'no state object found in db'});
    }
    cb(err);
  });
};

hueStateSchema.statics.usernameIsWhitelisted = function usernameIsWhitelisted(username) {

    return _.contains(whitelistCache, username);
};

/**
 * Lights Property Validator
 */

hueStateSchema.path('lights').validate(function (value) {
  // Validate entire lights object
  var boundedNumber = function boundedNumber(low, high) {
    return function (val, fieldName) {
      if (!_.isNumber(val)) {
        return false;
      }
      if (val < low) {
        val = low;
      }
      if (val > high) {
        val = high;
      }
      return true;
    };
  };

  var validEnum = function validEnum(enumVals) {
    return function (val, fieldName) {
      var pass = (_.contains(enumVals, val));
      if (!pass) {
        log.error({'VALIDATION_FAILED':fieldName});
      }
      return pass;
    }
  };

  // Used for reducing results of all validations
  var combineBools = function combineBools(current, next) { return current && next; }

  var lightValidator = function stateValidator(light) {
    var state = light.state;

    var bri = boundedNumber(0, 255)(state.bri, 'bri');
    var hue = boundedNumber(0, 65535)(state.hue, 'hue');
    var sat = boundedNumber(0, 255)(state.sat, 'sat');
    var ct  = boundedNumber(153, 500)(state.ct, 'ct');
    var alert = validEnum(['none', 'select', 'lselect'])(state.alert, 'alert');
    var effect = validEnum(['none', 'colorloop'])(state.effect, 'effect');
    var colormode = validEnum(['hs', 'xy', 'ct'])(state.colormode, 'colormode');
    var onStatus = _.isBoolean(state.on, 'on');
    var xy = (boundedNumber(0, 1)(state.xy[0], 'xy[0]') && boundedNumber(0, 1)(state.xy[1], 'xy[1]'));
    var nameLen = (light.name.length < 32);

    return (bri && hue && sat && ct && alert && effect && colormode && onStatus && xy && nameLen);
  };

  // Map lightValidator to all light properties in lights object, reduce to bool
  return _.reduce(_.map(value, lightValidator), combineBools, true); 
});

/**
 * HueState Controller Functions
 */

hueStateSchema.statics.getFullState = function getFullState(cb) {
  this.findOne(function (err, state) {
    if (err) {
      log.error(err);
      cb(err, null);
    }
    if (state) {
      cb(null, state);
    }
    else {
      cb('none found', null);
      log.error({error:'no state object found in db'});
    }
  });
};

hueStateSchema.statics.getStatePath = function getStatePath(path, cb) {
  this.findOne(function (err, state) {
    if (err) {
      log.error(err);
      cb(err, null);
    }
    if (state) {
      var pathComponents = path.split('.');
      var statePath;
      
      statePath = _.reduce(pathComponents, function(currentPath, nextComponent) {
                      if (currentPath && currentPath[nextComponent]) {
                        return currentPath[nextComponent];
                      }
                      else {
                        return undefined;
                      }
                    }, state);

      if (statePath) {
        cb(null, statePath);
      }
      else {
        log.error('invalid path');
        cb({path:'invalid path'}, null);
      }
    }
    else {
      cb('none found', null);
      log.error({error:'no state object found in db'});
    }
  });
};

hueStateSchema.statics.createUser = function createUser(username, devicetype, cb) {
  this.findOne(function(err, state) {
    cb = cb || function() {};
    var now = new Date().toISOString().slice(0, 19); // '2012-11-04T14:51:06.157Z'

    state.config.whitelist[username] = {
      'last use date': now,
      'create date': now,
      'name': devicetype
    };
    log.info(state.config);
    state.markModified('config.whitelist');
    state.save(function(err) {
      if (err) {
        log.error(err);
        cb(err, null);
      }
      else {
        updateWhitelistCache(this, cb);
      }
    });
  });
};

hueStateSchema.statics.renameLight = function renameLight(lightID, newName, cb) {
  this.findOne(function(err, state) {
    if (state) {
      var lightNames = _.map(state.lights, function (val, key, list) {
        if (key.indexOf(lightID) !== -1) {
          return '';
        }
        else {
          return val.name;
        }
      });
      var finalName = newName;
      var i = 1;
      for (i; _.contains(lightNames, finalName) && i < 15; i++) {
        finalName = newName + ' ' + i.toString();
      }
      state.lights[lightID].name = finalName;
      state.markModified('lights');
      state.save(function(err) {
        if (err) {
          log.error(err);
          cb(err, null);
        }
        else {
          cb(null, finalName);
        }
      });
    }
    else {
      // Invalid light index
      cb({error:'invalid light index'}, null);
    }
  });
};

hueStateSchema.statics.setLightState = function setLightState(lightID, newState, cb) {
  this.findOne(function(err, hueState) {
    if (hueState) {
      _.each(newState, function (val, key, list) {
        hueState.lights[lightID].state[key] = val;
      });

      hueState.markModified('lights');
      hueState.save(function(err) {
        if (err) {
          log.error({'err.name':err.name, 'err.message':err.message});
          log.error(err);
          cb(err, null);
        }
        else {
          cb(null, newState);
        }
      });
    }
    else {
      // Invalid light index
      cb({error:'invalid light index'}, null);
    }
  });
};

/**
 * Pre and Post Actions
 */


////////////////////// DO SEPARATE VALIDATIONS FOR EACH FIELD IN PRE HOOKS

hueStateSchema.pre('validate', function (next) {
  log.info('Pre validate hook');
  //log.info(this.lights);
  //var err = new Error('something went wrong');
  //next(err);
  next();
});

hueStateSchema.post('save', function (state) {
  log.info('successfully saved state');
});

/**
 * Exports
 */


exports.HueStateExport = mongoose.model('HueState', hueStateSchema);

/**
 * Module Init
 */

updateWhitelistCache(exports.HueStateExport, function() {

  log.info('whitelist cache initialized');
});
