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
            console.log(obj);
            lineshash[task.id] = obj;
            callback();
        });
    },1);
    ids_list.forEach(function(id) {
        q.push({id:id});
    });
    q.drain = function() {
        cb(lineshash);
    }
};

var GLOBALS = {};
GLOBALS.sender = 'rook2pawn_gw';
GLOBALS.destination = 'rook2pawn';
GLOBALS.currency = 'RKP';

// trustline limit
GLOBALS.trust = { limit : undefined, balance : undefined };

exports.testCurrencyIssuance = function(test) {
    console.log("TestCurrencyIssuance");
    test.expect(4);
    async.series([
        function(cb) {
            remote.connect(function() {
                cb()
            })
        },
        function(cb) {
            getAccountLines([testconfig.people[GLOBALS.destination]],function(response) {
                response[testconfig.people[GLOBALS.destination]].lines.forEach(function(obj) {
                    if ((obj.account == testconfig.people[GLOBALS.sender]) && (obj.currency == GLOBALS.currency))  {
                        GLOBALS.trust.limit = parseInt(obj.limit);
                        GLOBALS.trust.balance = parseInt(obj.balance);
                    }
                });
                cb()
            });
        },
        function(cb) {
            console.log("Use Case 3: Currency Issuance. Case 2 Sending -1 RKP");
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
                        "currency": GLOBALS.currency,
                        "issuer": testconfig.people[GLOBALS.sender] 
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
            req.write(JSON.stringify(payment1));
            req.end();
        },
        function(cb) {
            console.log("Use Case 3: Currency Issuance. Case 3 Sending 0 RKP");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send 0 RKP
            var payment1 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "0",
                        "currency": GLOBALS.currency,
                        "issuer": testconfig.people[GLOBALS.sender] 
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
            req.write(JSON.stringify(payment1));
            req.end();
        },
        function(cb) {
            console.log("Use Case 3: Currency Issuance. Case 4 Sending RKP amount that exceeds trust line");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // this should be 1 too much.
            var newamount = (GLOBALS.trust.limit - GLOBALS.trust.balance) + 1;
            console.log("New amount to send :" + newamount);

            var payment1 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": newamount.toString(),
                        "currency": GLOBALS.currency,
                        "issuer": testconfig.people[GLOBALS.sender] 
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
            req.write(JSON.stringify(payment1));
            req.end();
        },
        function(cb) {
            console.log("Use Case 3: Currency Issuance. Case 1 Sending +1 RKP");
            var connectobj = {
                hostname:'localhost',
                'Content-Type' : 'application/json',
                port: 5990,
                path: '/v1/payments',
                method:'POST'
            };
            // try to send +1 RKP
            var payment1 = {
                "secret": testconfig.secrets[GLOBALS.sender],
                "client_resource_id": lib.generateUUID(),
                "payment": {
                    "source_account": testconfig.people[GLOBALS.sender],
                    "destination_account": testconfig.people[GLOBALS.destination],
                    "destination_amount": {
                        "value": "1",
                        "currency": GLOBALS.currency,
                        "issuer": testconfig.people[GLOBALS.sender] 
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
        ],
        function(err,results) {
            console.log("All done!");
            console.log(results);
            var case1 = results[2];
            var case2 = results[3];
            var case3 = results[4];
            var case4 = results[5];
            test.ok(((case1.success === false) && (case1.error == 'temBAD_AMOUNT')), 'should pass');
            test.ok(((case2.success === false) && (case2.error == 'temBAD_AMOUNT')), 'should pass');
            test.ok(((case3.success === false) && (case3.error == 'tecPATH_PARTIAL')), 'should pass');
            test.ok(((case4.success === true) && (case4.error == undefined)), 'should pass');
            test.done();
        }
    );
};
