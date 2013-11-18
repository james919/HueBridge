var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*var hueWhitelistEntry = new Schema({

})
*/


var hueConfigSchema = new Schema({
  name: String,
  mac: String,
  dhcp: Boolean,
  ipaddress: String,
  netmask: String,
  gateway: String,
  proxyaddress: String,
  proxyport: Number,
  UTC: String,
  whitelist: {},
  swversion: String,
  swupdate: {},
  linkbutton: Boolean,
  portalservices: Boolean
});

exports.HueConfig = mongoose.model('HueConfig', hueConfigSchema);
exports.HueConfigSchema = hueConfigSchema;