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
GLOBALS.sender = 'rook2pawn_gw_cold';
GLOBALS.gateway = 'rook2pawn_gw';
GLOBALS.destination = 'rook2pawn_receiver';
GLOBALS.sendamount = 0.1;
GLOBALS.currency = 'RKP';

// trustline limit before
// s trust to gw
// gw trust to s and d
// d trust to gw 
GLOBALS.trust_b = {};
GLOBALS.trust_b.s = { limit : undefined, balance : undefined };
GLOBALS.trust_b.gw_s = { limit : undefined, balance : undefined };
GLOBALS.trust_b.gw_d = { limit : undefined, balance : undefined };
GLOBALS.trust_b.d = { limit : undefined, balance : undefined };

// trustline limit after
GLOBALS.trust_a = {};
GLOBALS.trust_a.s = { limit : undefined, balance : undefined };
GLOBALS.trust_a.gw_s = { limit : undefined, balance : undefined };
GLOBALS.trust_a.gw_d = { limit : undefined, balance : undefined };
GLOBALS.trust_a.d = { limit : undefined, balance : undefined };

async.series([
    function(cb) {
        remote.connect(function() {
            cb()
        })
    },
    // grab before trust lines
    function(cb) {
        getAccountLines([
            testconfig.people[GLOBALS.destination],
            testconfig.people[GLOBALS.sender],
            testconfig.people[GLOBALS.gateway]
            ],
            function(response) {
                var lines_d = response[testconfig.people[GLOBALS.destination]].lines;
                var lines_s = response[testconfig.people[GLOBALS.sender]].lines;
                var lines_gw = response[testconfig.people[GLOBALS.gateway]].lines;
                lines_d.forEach(function(item) {
                    if ((item.account == testconfig.people[GLOBALS.gateway])
                    && (item.currency == GLOBALS.currency)) {
                        GLOBALS.trust_b.d = { limit : parseFloat(item.limit), balance : parseFloat(item.balance)};
                    }
                });
                lines_s.forEach(function(item) {
                    if ((item.account == testconfig.people[GLOBALS.gateway])
                    && (item.currency == GLOBALS.currency)) {
                        GLOBALS.trust_b.s = { limit : parseFloat(item.limit), balance : parseFloat(item.balance)};
                    }
                });
                lines_gw.forEach(function(item) {
                    if ((item.account == testconfig.people[GLOBALS.sender])
                    && (item.currency == GLOBALS.currency)) {
                        GLOBALS.trust_b.gw_s = { limit : parseFloat(item.limit), balance : parseFloat(item.balance)};
                    }
                    if ((item.account == testconfig.people[GLOBALS.destination])
                    && (item.currency == GLOBALS.currency)) {
                        GLOBALS.trust_b.gw_d = { limit : parseFloat(item.limit), balance : parseFloat(item.balance)};
                    }
                });
                log(GLOBALS);
                cb()
            }
        );
    }
]);

