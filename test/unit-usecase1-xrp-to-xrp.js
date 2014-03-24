var util = require('util');
var http = require('http');
var lib = require('./unit-lib');
var Remote = require('ripple-lib').Remote;
var async = require('async');
var Hash = require('hashish');
var log = function(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: null }));
};
var testconfig = require('./testconfig');
var PEOPLE = testconfig.people;

// shared GLOBALS between tests
var GLOBALS = { uuid: undefined };

var remote = new Remote(testconfig.remote);

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
    test.expect(2);
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
                "secret": testconfig.secrets[GLOBALS.sender],
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
            var diff = diffobj(before,after);
            log(diff);
            var s = Math.round(diff[PEOPLE[GLOBALS.sender]]/1000000);
            var d = Math.round(diff[PEOPLE[GLOBALS.destination]]/1000000);
            console.log(s);
            console.log(d);
            test.ok(-1 == s, 'sender is down approx 1 drop');
            test.ok(1 == d, 'receiver is up approx 1 drop');
            test.done();
        }
    );
};
