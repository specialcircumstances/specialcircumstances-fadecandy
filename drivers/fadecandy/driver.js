/* My fadecandy driver */
'use strict';

var WebSocket = require('ws');

// a list of devices, with their 'id' as key
// it is generally advisable to keep a list of
// paired and active devices in your driver's memory.
var devices = {};


// the `added` method is called is when pairing is done and a device has been added
module.exports.added = function( device_data, callback ) {
    initDevice( device_data );
    callback( null, true );
}

// the `delete` method is called when a device has been deleted by a user
module.exports.deleted = function( device_data, callback ) {
    delete devices[ device_data.id ];
    callback( null, true );
}

// the `pair` method is called when a user start pairing
module.exports.pair = function( socket ) {
  socket.on('start', function( data, callback ) {

      // fire the callback (you can only do this once)
      // ( err, result )
      callback( null, 'Started!' );

      // send a message to the front-end, even after the callback has fired
      setTimeout(function(){
          socket.emit("hello", "Hello to you!", function( err, result ){
              console.log( result ); // result is `Hi!`
          });
      }, 2000);

  });
  socket.on('list_devices', function( data, callback ){

      var device_data = {
          name: "New Device",
          data: {
              id: "host:port"
          }
      };

      callback( null, [ device_data ] );

  });
  socket.on('add_device', function( data, callback ){

      var device_data = {
          name: "New Device",
          data: {
              id: "host:port"
          }
      };

      callback( null, [ device_data ] );

  });
  socket.on('disconnect', function(){
        console.log("User aborted pairing, or pairing is finished");
  });
}

// these are the methods that respond to get/set calls from Homey
// for example when a user pressed a button
module.exports.capabilities = {};
module.exports.capabilities.onoff = {};
module.exports.capabilities.onoff.get = function( device_data, callback ) {

    var device = getDeviceByData( device_data );
    if( device instanceof Error ) return callback( device );

    return callback( null, device.state.onoff );

}
module.exports.capabilities.onoff.set = function( device_data, onoff, callback ) {

    var device = getDeviceByData( device_data );
    if( device instanceof Error ) return callback( device );

    device.state.onoff = onoff;

    // here you would use a wireless technology to actually turn the device on or off
    if( onoff ) {
      FcTurnOff( callback, device_data.id );
    } else {
      FcTurnOn( callback, device_data.id );
    }
    // also emit the new value to realtime
    // this produced Insights logs and triggers Flows
    self.realtime( device_data, 'onoff', device.state.onoff)

    return callback( null, device.state.onoff );

}

// a helper method to get a device from the devices list by it's device_data object
function getDeviceByData( device_data ) {
    var device = devices[ device_data.id ];
    if( typeof device === 'undefined' ) {
        return new Error("invalid_device");
    } else {
        return device;
    }
}

module.exports.init = function (devices_data, callback) {
    // when the driver starts, Homey rebooted. Initialise all previously paired devices.
    devices_data.forEach(function (device_data) {
        // do something here to initialise the device, e.g. start a socket connection
        FcReset(callback, device_data.id);
    });
    // let Homey know the driver is ready
    callback();
}

/*
// the `init` method is called when your driver is loaded for the first time
module.exports.init = function( devices_data, callback ) {
    devices_data.forEach(function(device_data){
        initDevice( device_data );
    });

    callback();
}
// a helper method to add a device to the devices list
function initDevice( device_data ) {
    devices[ device_data.id ] = {};
    devices[ device_data.id ].state = { onoff: true };
    devices[ device_data.id ].data = device_data;
}
*/
/*
module.exports.capabilities = {
    dim: {

        // this function is called by Homey when it wants to GET the dim state, e.g. when the user loads the smartphone interface
        // `device_data` is the object as saved during pairing
        // `callback` should return the current value in the format callback( err, value )
        get: function( device_data, callback ){
            // get the bulb with a locally defined function
            var bulb = getBulb( device_data.id );
            if( bulb instanceof Error ) return callback( bulb );
            // send the dim value to Homey
            callback( null, bulb.state.dim );
        },

        // this function is called by Homey when it wants to SET the dim state, e.g. when the user says 'red lights'
        // `device_data` is the object as saved during pairing
        // `dim` is the new value
        // `callback` should return the new value in the format callback( err, value )
        set: function( device_data, dim, callback ) {
            var bulb = getBulb( device_data.id );
            if( bulb instanceof Error ) return callback( bulb );

            if( bulb.state.dim != dim ) {
                bulb.state.dim = dim;
                module.exports.realtime( device_data, 'dim', dim);
                updateBulb( device_data.id );
            }

            // send the new dim value to Homey
            callback( null, bulb.state.dim );
        }
    }
}
*/

function FcTurnOn (callback, url) {
  var cmd = "BUT:ON";
  var mydata = {};
  mydata.url = url;
  mydata.data = cmd;
  WebSocketSend (callback, mydata);
}

function FcTurnOff (callback, url) {
  var cmd = "BUT:OFF";
  var mydata = {};
  mydata.url = url;
  mydata.data = cmd;
  WebSocketSend (callback, mydata);
}

function FcReset (callback, url) {
  var cmd = "BUT:RST";
  var mydata = {};
  mydata.url = url;
  mydata.data = cmd;
  WebSocketSend (callback, mydata);
}


// Websocket send action
function WebSocketSend (callback, args) {
  debugLog('web_socket_send', {args: args});
  var url = args.url;
  var data = args.data;
  try {
    var ws = new WebSocket(url);
  } catch (error) {
    return callback(error);
  }
  ws.on('open', function () {
    ws.send(data, function () {
      ws.close();
      debugLog('  --> webSocket Send action completed');
      callback(null, true);
    });
  }).on('error', function (error) {
    debugLog('  --> webSocket Send action failed', error);
    callback(error);
  });
}

function debugLog (message, data) {
  var logLine = {datetime: new Date(), message: message};
  if (data) logLine.data = data;
  Homey.manager('api').realtime('HTTP Log', logLine);
  Homey.log(this.epochToTimeFormatter(), message, data || '');
}
