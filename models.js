'use strict';

exports.HueState = require('./models/HueState').HueStateExport;

//var bootstrapData = require('./bootstrapData');





/*exports.getWhitelist = function getWhitelist() {
  exports.getFullState(function(err, state) {
    return (function(s) {
      log.info({s:s.config.whitelist});
      return _.keys(s.config.whitelist);
    })(state);
  });
};*/