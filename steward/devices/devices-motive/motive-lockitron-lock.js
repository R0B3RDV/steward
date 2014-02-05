// lockitron - interactive plant care: http://www.lockitron.com

var util        = require('util')
  , devices     = require('./../../core/device')
  , steward     = require('./../../core/steward')
  , utility     = require('./../../core/utility')
  , motive     = require('./../device-motive')
  ;


var logger = motive.logger;


var Lock = exports.Device = function(deviceID, deviceUID, info) {
  var param, self;

  self = this;

  self.whatami = info.deviceType;
  self.deviceID = deviceID.toString();
  self.deviceUID = deviceUID;
  self.name = info.device.name;
  self.getName();

  self.serial = info.device.unit.serial;

  self.info = {};
  if (!!info.params.status) {
    self.status = info.params.status;
    delete(info.params.status);
  } else self.status = 'present';
  for (param in info.params) {
    if ((info.params.hasOwnProperty(param)) && (!!info.params[param])) self.info[param] = info.params[param];
  }

  self.changed();
  self.gateway = info.gateway;

  utility.broker.subscribe('actors', function(request, taskID, actor, perform, parameter) {
    if (actor !== ('device/' + self.deviceID)) return;

    if (request === 'perform') return self.perform(self, taskID, perform, parameter);
  });
};
util.inherits(Lock, motive.Device);


Lock.prototype.update = function(self, params, status) {
  var param, updateP;

  updateP = false;
  if ((!!status) && (status !== self.status)) {
    self.status = status;
    updateP = true;
  }
  for (param in params) {
    if ((!params.hasOwnProperty(param)) || (!params[param]) || (self.info[param] === params[param])) continue;

    self.info[param] = params[param];
    updateP = true;
  }
  if (updateP) self.changed();
};


Lock.prototype.perform = function(self, taskID, perform, parameter) {
  var params;

  try { params = JSON.parse(parameter); } catch(ex) { params = {}; }

  switch (perform) {
    case 'set':
      return self.setName(params.name, taskID);

    case 'lock':
    case 'unlock':
      break;

    default:
      return false;
  }

  if (!self.gateway.lockitron) return false;

  self.gateway.lockitron.roundtrip('GET', '/locks/' + self.serial + '/' + perform, null, function(err, results) {
    if (!!err) return logger.error('device/' + self.deviceID, { event: perform, diagnostic: err.message });

    try {
      self.state = results.data.activity.updated_current === 'lock' ? 'locked' : 'unlocked';
      self.changed();
    } catch(ex) {
      logger.error('device/' + self.deviceID, { event: perform, diagnostic: ex.message, results: results });
    }
  });

  return steward.performed(taskID);
};

var validate_perform = function(perform, parameter) {
  var params = {}
    , result = { invalid: [], requires: [] }
    ;

  if (!!parameter) try { params = JSON.parse(parameter); } catch(ex) { result.invalid.push('parameter'); }

  switch (perform) {
    case 'set':
      if (!params.name) result.requires.push('name');
      break;

    case 'lock':
    case 'unlock':
      break;

    default:
      result.invalid.push('perform');
      break;
  }

  return result;
};


exports.start = function() {
  steward.actors.device.motive.lockitron = steward.actors.device.motive.lockitron ||
      { $info     : { type: '/device/motive/lockitron' } };

  steward.actors.device.motive.lockitron.lock =
      { $info     : { type       : '/device/motive/lockitron/lock'
                    , observe    : [ ]
                    , perform    : [ 'lock', 'unlock' ]
                    , properties : { name       : true
                                   , status     : [ 'locked', 'unlocked' ]
                                   , location   : 'coordinates'
                                   , lastSample : 'timestamp'
                                   }
                    }
      , $validate : { perform    : validate_perform
                    }
      };
  devices.makers['/device/motive/lockitron/lock'] = Lock;
};
