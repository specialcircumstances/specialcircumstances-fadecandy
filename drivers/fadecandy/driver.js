'use strict';

const Log = require('homey-log').Log;
const _  = require('underscore');

const saveTimeout = 1;
const instancePropertiesBlacklistWhenOff = [ 'alert', 'effect', 'brightness', 'colorTemp' ];


module.exports.init = function( devices_data, callback ) {

    // when the driver starts, Homey rebooted. Initialise all previously paired devices.
    devices_data.forEach(function(device_data){
        // do something here to initialise the device, e.g. start a socket connection
    })

    // let Homey know the driver is ready
    callback();
}

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
