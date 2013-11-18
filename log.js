'use strict';

var bunyan = require('bunyan');

module.exports = bunyan.createLogger({
  name: 'HueBridge',
  level: process.env.LOG_LEVEL || 'info',
  stream: process.stdout,
  serializers: bunyan.stdSerializers
});