var util = require('util');
var http = require('http');
var lib = require('./unit-lib');
var Remote = require('ripple-lib').Remote;
var testconfig = require('./testconfig');
var async = require('async');
var Hash = require('hashish');
var log = function(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: null }));
};
var remote = new Remote(testconfig.remote)
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
var getAccountLines = function(ids_list,cb) {
    var lineshash = {};
    var q = async.queue(function(task,callback) {
        remote.request_account_lines(task.id,function(err,obj) {    
            lineshash[task.id] = obj;
        });
    },1);
};
/* Currency redemption is we are issued currecny by gateway
 * we are trying to redeem that currency */
var GLOBALS = {};
GLOBALS.sender = 'rook2pawn';
GLOBALS.destination = 'rook2pawn_gw';
GLOBALS.before = undefined;
GLOBALS.after = undefined;
GLOBALS.idlist = Hash(testconfig.people).extract([GLOBALS.sender,GLOBALS.destination]).values;

exports.testUseCase2CurrencyRedemption = function(test) {
    console.log('testUseCase2CurrencyRedemption');
    test.expect(4);
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
        // perform Currency Redemption
        function(cb) {
            console.log("Use Case 2: Currency Redemption. Case 1 Sending -1 RKP");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send -1 RKP
            var payment1 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "-1",
                        "currency": "RKP",
                        "issuer": testconfig.people[GLOBALS.destination] 
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
                    console.log("RESULTS for case 1");
                    console.log(obj);
                    cb(null,obj);
                });
            });
            req.write(JSON.stringify(payment1));
            req.end();
        },
        // perform Currency Redemption
        function(cb) {
            console.log("Use Case 2: Currency Redemption. Case 2 Sending 0 RKP");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send 0 RKP
            var payment2 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "0",
                        "currency": "RKP",
                        "issuer": testconfig.people[GLOBALS.destination] 
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
                    console.log("RESULTS for case 2");
                    console.log(obj);
                    cb(null,obj);
                });
            });
            req.write(JSON.stringify(payment2));
            req.end();
        },
        // perform Currency Redemption
        function(cb) {
            console.log("Use Case 2: Currency Redemption. Case 3 sending more than you have");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send > owned RKP
            var payment3 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "255",
                        "currency": "RKP",
                        "issuer": testconfig.people[GLOBALS.destination] 
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
                    console.log("RESULTS for case 3");
                    console.log(obj);
                    cb(null,obj);
                });
            });
            req.write(JSON.stringify(payment3));
            req.end();
        },
        // perform Currency Redemption
        function(cb) {
            console.log("Use Case 2: Currency Redemption. case 4 sending a regular, small valid amount.");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send > 0 but less than maximum owned RKP
            var payment4 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "1",
                        "currency": "RKP",
                        "issuer": testconfig.people[GLOBALS.destination] 
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
                    console.log("RESULTS for case 4");
                    console.log(obj);
                    cb(null,obj);
                });
            });
            req.write(JSON.stringify(payment4));
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
            console.log("THE RESULTS ARE");
            console.log(results);
            var case1 = results[2];
            var case2 = results[3];
            var case3 = results[4];
            var case4 = results[5];
            test.ok(((case1.success === false) && (case1.error === 'temBAD_AMOUNT')),'Should pass');
            test.ok(((case2.success === false) && (case2.error === 'temBAD_AMOUNT')),'Should pass');
            test.ok(((case3.success === false) && (case3.error === 'tecPATH_PARTIAL')),'Should pass');
            test.ok(((case4.success === true) && (case4.error === undefined)),'Should pass');
            test.done();
        }
    );
};
