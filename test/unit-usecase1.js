var util = require('util');
var http = require('http');
var lib = require('./unit-lib');
var Remote = require('ripple-lib').Remote;
var async = require('async');
var Hash = require('hashish');
var log = function(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: null }));
};
var PEOPLE = {};

PEOPLE.rook2pawn = 'rwUNHL9AdSupre4tGb7NXZpRS1ift5sR7W';
PEOPLE.rook2pawn_gw = 'rpzgG7yxjEP9EHf2roftLvPTvt4wfL3iYY';
PEOPLE.rook2pawn_mm = 'rpXF7z1sypK41CFhFzNHczSE47w8rGLx7W';
PEOPLE.rook2pawn_receiver = 'rp4GSjosE4TrPvmmfxFhu2Awf7BQn4dQoH';

// shared GLOBALS between tests
var GLOBALS = { uuid: undefined };

exports.argh = function(test) {
    test.expect(1);
    test.ok(true,"yay");
    test.done();
};

var remote = new Remote({
  // see the API Reference for available options
  trusted:        true,
  local_signing:  true,
  local_fee:      true,
  fee_cushion:     1.5,
  servers: [
    {
        host:    's1.ripple.com'
      , port:    443
      , secure:  true
    }
  ]
});

// takes a list of ids, gives back a hash of ids : balances
var getBalances = function(ids_list,cb) {
    var balancehash = {};
    var q = async.queue(function(task,callback) {
        remote.request_account_info(task.id,function(err,obj) {
            balancehash[task.id] = obj; 
                
            callback();
        });
    },1);
    ids_list.forEach(function(id) {
        q.push({id:id});
    });
    q.drain = function() {
        cb(balancehash);
    }
};

var GLOBALS = {};
GLOBALS.sender = 'rook2pawn';
GLOBALS.destination = 'rook2pawn_receiver';
GLOBALS.before = undefined;
GLOBALS.after = undefined;
GLOBALS.idlist = Hash(PEOPLE).extract([GLOBALS.sender,GLOBALS.destination]).values;


exports.testUseCase1XRPtoXRP = function(test) {
    console.log('testUseCase1-XRP-to-XRP');
    test.expect(1);
    test.ok(true,"this is true!");
    test.done();
    async.series([
        function(cb) {
            remote.connect(function() {
                cb()
            })
        },
        function(cb) { 
            console.log("aquiring balances");
            getBalances(GLOBALS.idlist,function(balances) {
                console.log("These are the balances!!!!\n");
                console.log(balances);
                GLOBALS.before = balances;
                cb();
            });
        },
        // perform XRP to XRP
        function(cb) {
            console.log("Use Case 1: XRP to XRP");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            var payment = {
                "secret": "shDiLVUXYGFDCoMDP6HfHnER5dpmP",
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": PEOPLE[GLOBALS.sender],
                    "destination_account": PEOPLE[GLOBALS.destination],
                    "destination_amount": {
                        "value": "1",
                        "currency": "XRP",
                        "issuer": ""
                    }
                }
            };
            connectobj.headers = {
                'Content-Type':'application/json'
            }
            var req = http.request(connectobj,function(res) {
                var body = "";
                res.setEncoding('utf8');
                res.on('data',function(chunk) {
                    body = body.concat(chunk);
                });
                res.on('end',function() {
                    var obj = JSON.parse(body);
                    cb(null,obj);
                });
            });
            req.write(JSON.stringify(payment));
            req.end();
        },
        function(cb) { 
            console.log("aquiring balances");
            getBalances(GLOBALS.idlist,function(balances) {
                GLOBALS.after = balances;
                cb();
            });
        },
        ],
        function(err, results) {
            var before = {};
            var after = {};
            Hash(GLOBALS.before).forEach(function(val,key) {
                before[key] = parseInt(val.account_data.Balance);
            })
            Hash(GLOBALS.after).forEach(function(val,key) {
                after[key] = parseInt(val.account_data.Balance);
            })
            console.log("Balances before transaction");
            log(before);
            console.log("Balances after transaction");
            log(after);
            // take obj2 - obj1;
            var diffobj = function(obj1,obj2) {
                var result = {};
                Hash(obj2).forEach(function(val,key) {
                    if (obj1[key] !== undefined) {
                        var diff = val - obj1[key];
                        result[key] = diff;
                    }
                });
                return result;
            }
            console.log("Difference between after and before");
            console.log(diffobj(before,after));
        }
    );
};
