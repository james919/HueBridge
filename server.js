'use strict';

var restify = require('restify');
var mongoose = require('mongoose');
var routes = require('./routes');
var models = require('./models');
var log = require('./log');
var HueState = models.HueState;

mongoose.connect('mongodb://localhost/huebridge');

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function callback() {
  log.info('db connection open');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

var server = restify.createServer({
  log: log,
  name: 'HueBridge'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.throttle({
  burst: 100,
  rate: 50,
  ip: true, // throttle based on source ip address
  overrides: {
    '127.0.0.1': {
      rate: 0, // unlimited
      burst: 0
    }
  }
}));
server.on('after', restify.auditLogger({
  log: log
}));

server.use(routes.checkUsername(HueState));

server.get('/bootstrap', routes.bootstrapData(HueState));

server.post('/api', routes.createUser(HueState));
server.get('/api/:username', routes.getFullState(HueState));
server.get('/api/:username/config', routes.getConfig(HueState));
server.put('/api/:username/config', routes.modifyConfig(HueState));
server.del('/api/:username/config/whitelist/:username2', routes.deleteUser(HueState));

server.get('/api/:username/lights', routes.getAllLights(HueState));
server.get('/api/:username/lights/new', routes.getNewLights(HueState));
server.post('/api/:username/lights', routes.searchForNewLights(HueState));
server.get('/api/:username/lights/:id', routes.getLightAttributes(HueState));
server.put('/api/:username/lights/:id', routes.setLightAttributes(HueState));
server.put('/api/:username/lights/:id/state', routes.setLightState(HueState));

server.get('/api/:username/groups', routes.getAllGroups(HueState));
server.get('/api/:username/groups/:id', routes.getGroupAttributes(HueState));
server.put('/api/:username/groups/:id', routes.setGroupAttributes(HueState));
server.put('/api/:username/groups/:id/action', routes.setGroupState(HueState));

server.get('/api/:username/schedules', routes.getAllSchedules(HueState));
server.post('/api/:username/schedules', routes.createSchedule(HueState));
server.get('/api/:username/schedules/:id', routes.getScheduleAttributes(HueState));
server.put('/api/:username/schedules/:id', routes.setScheduleAttributes(HueState));
server.del('/api/:username/schedules/:id', routes.deleteSchedule(HueState));

server.listen(8080, function () {
  log.info('%s listening at %s', server.name, server.url);
});