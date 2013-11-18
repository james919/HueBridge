'use strict';

/**
 * Module dependencies.
 */

var _ = require('underscore');
var uuid = require('node-uuid');
var log = require('./log');

/**
 * Bootstrap
 */
var bootstrapHueData = require('./bootstrapData');

exports.bootstrapData = function bootstrapData(HueState) {
  return function(req, res) {
    var Hue = new HueState(bootstrapHueData);
    Hue.remove(function(errRem) {
      if (errRem) {
        log.info(errRem);
        res.send(errRem);
      }
      Hue.save(function(err, hue) {
        if (err) {
          log.error(err);
        }
        else {
          res.send(hue);
        }
        
      });
    });
  };
};

/*
 * Verify user exists
 */
exports.checkUsername = function checkUsername(HueState) {
  return function (req, res, next) {
    var isBootstrapCall = req.route.path.indexOf('/bootstrap') !== -1;
    var isValidUsername = req.params.username && HueState.usernameIsWhitelisted(req.params.username);
    if (req.params.devicetype || isBootstrapCall || isValidUsername) {
      next();
    }
    else {
      var errorResponse = {
        'error': {
          'type': 1,
          'address': '/',
          'description': 'unauthorized user'
        }
      };
      res.send(errorResponse);
    }
  };
};

/**
 * Config API
 */

exports.createUser = function createUser(HueState) {
  return function (req, res) {
  
    var response = {
      'devicetype': req.body.devicetype,
      'username': uuid.v1(),
    };

    HueState.createUser(response.devicetype, response.username, function(err) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(response);
      }
    });

  };
};

exports.getConfig = function getConfig(HueState) {
  return function (req, res) {
    HueState.getStatePath('config', function(err, statePath) {
      res.send(err || statePath);
    });
  };
};

exports.modifyConfig = function modifyConfig(HueState) {
  return function (req, res) {

  };
};

exports.deleteUser = function deleteUser(HueState) {
  return function (req, res) {
    
  };
};

exports.getFullState = function getFullState(HueState) {
  return function (req, res) {
    HueState.getFullState(function(err, fullState) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(fullState);
      }
    });
  };
};

/**
 * Lights API
 */

exports.getAllLights = function getAllLights(HueState) {
  return function (req, res) {
    HueState.getStatePath('lights', function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.getNewLights = function getNewLights(HueState) {
  return function (req, res) {
    
  };
};

exports.searchForNewLights = function searchForNewLights(HueState) {
  return function (req, res) {
    
  };
};

exports.getLightAttributes = function getLightAttributes(HueState) {
  return function (req, res) {
    HueState.getStatePath('lights.' + req.params.id, function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.setLightAttributes = function setLightAttributes(HueState) {
  return function (req, res) {
    var lightID = req.params.id;
    var newName = req.body.name;
    if (lightID && newName) {
      HueState.renameLight(lightID, newName, function (err, name) {
        if (err) {
          res.send(err);
        }
        else {
          log.info('successfully changed name');
          var pathString = '/lights/' + req.params.id + '/name';
          var response = {};
          response[pathString] = name;
          res.send(response);
        }
      });
    }
    else {
      // Missing or incorrect body param
    }
  };
};

exports.setLightState = function setLightState(HueState) {
  return function (req, res) {
    var lightID = req.params.id;
    var newState = req.body;
    if (lightID && newState) {
      HueState.setLightState(lightID, newState, function(err, results) {
        if (err) {
          log.info({'error':err.message});
          res.send({'error':err.message});
        }
        else {
          log.info('successfully updated light state');

          var responseArray = [];
          _.each(results, function (val, key, list) {
            var pathString = '/lights/' + req.params.id + '/' + key;
            var response = {};
            response[pathString] = val;
            responseArray.push(response);
          });
          
          res.send(responseArray);
        }
      });
    }
    else {
      // Missing or incorrect body param
    }
  };
};

/**
 * Groups API
 */

exports.getAllGroups = function getAllGroups(HueState) {
  return function (req, res) {
    HueState.getStatePath('groups', function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.createGroup = function createGroup(HueState) {
  return function (req, res) {
    
  };
};

exports.getGroupAttributes = function getGroupAttributes(HueState) {
  return function (req, res) {
    HueState.getStatePath('groups.' + req.params.id, function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.setGroupAttributes = function setGroupAttributes(HueState) {
  return function (req, res) {
    
  };
};

exports.setGroupState = function setGroupState(HueState) {
  return function (req, res) {
    
  };
};

exports.deleteGroup = function deleteGroup(HueState) {
  return function (req, res) {
    
  };
};

/**
 * Schedules API
 */

exports.getAllSchedules = function getAllSchedules(HueState) {
  return function (req, res) {
    HueState.getStatePath('schedules', function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.createSchedule = function createSchedule(HueState) {
  return function (req, res) {
    
  };
};

exports.getScheduleAttributes = function getScheduleAttributes(HueState) {
  return function (req, res) {
    HueState.getStatePath('schedules.' + req.params.id, function(err, statePath) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(statePath);
      }
    });
  };
};

exports.setScheduleAttributes = function setScheduleAttributes(HueState) {
  return function (req, res) {
    
  };
};

exports.deleteSchedule = function deleteSchedule(HueState) {
  return function (req, res) {
    
  };
};