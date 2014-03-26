exports.remote = {
  // see the API Reference for available options
  trusted:        true,
  local_signing:  true,
  local_fee:      true,
  fee_cushion:     1.5,
  servers: [
    {
        host:    's1.ripple.com'
      , port:    443
      , secure:  false
    }
  ]
};


var people = {};
people.rook2pawn = 'rwUNHL9AdSupre4tGb7NXZpRS1ift5sR7W';
people.rook2pawn_gw = 'rpzgG7yxjEP9EHf2roftLvPTvt4wfL3iYY';
people.rook2pawn_mm = 'rpXF7z1sypK41CFhFzNHczSE47w8rGLx7W';
people.rook2pawn_receiver = 'rp4GSjosE4TrPvmmfxFhu2Awf7BQn4dQoH';
people.rook2pawn_gw_cold = 'r97EYvF42JJdEFF3qaXPnDC2C7gP7Ar42Q';
people.rook2pawn_gw_hot = 'ra5ZbQZSAu8GgANvAWKjohDiJWy1RiptxC';
exports.people = people;
var fs = require('fs');
var path = require('path');
var fsecrets;
if (fs.existsSync(path.join(__dirname,'secret.js')))
    fsecrets = require('./secret').secrets;
var secrets = {};
secrets.rook2pawn = process.env.SECRET_SENDER || fsecrets.rook2pawn;
secrets.rook2pawn_gw = process.env.SECRET_GW || fsecrets.rook2pawn_gw;
secrets.rook2pawn_mm = process.env.SECRET_MM || fsecrets.rook2pawn_mm;
secrets.rook2pawn_receiver = process.env.SECRET_RECEIVER || fsecrets.rook2pawn_receiver;
secrets.rook2pawn_gw_cold = process.env.SECRET_GW_COLD || fsecrets.rook2pawn_gw_cold;
secrets.rook2pawn_gw_hot = process.env.SECRET_GW_HOT || fsecrets.rook2pawn_gw_hot;
exports.secrets = secrets;
