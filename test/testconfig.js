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
exports.people = people;

var secrets = {};
secrets.rook2pawn = process.env.SECRET_SENDER || 'shDiLVUXYGFDCoMDP6HfHnER5dpmP';
secrets.rook2pawn_gw = process.env.SECRET_GW || 'ssR6VukdxALxWdbPrRn79qmcQ7jUp';
secrets.rook2pawn_mm = process.env.SECRET_MM || 'sasik63mHZbFnqMVY4E8dgzVwRbE7';
secrets.rook2pawn_receiver = process.env.SECRET_RECEIVER || 'shCASB7uWpt5jnX8EuU3BZh1ZQxVP';
secrets.rook2pawn_gw_cold = process.env.SECRET_GW_COLD || 'snhw3b4GFrk57EacGg4Gc6j7zAhEw';
exports.secrets = secrets;
