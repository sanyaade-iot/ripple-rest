var util = require('util');
var log = function(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: null }));
};
// Test 
var http = require('http');
// shared GLOBALS between tests
var GLOBALS = { uuid: undefined };

var payments = function(test) {
    console.log("\nPOST /v1/payments");
    console.log("Test that we can make a payment.");
    test.expect(3);
    var generateUUID = function (){
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };
    var connectobj = {
        hostname:'localhost',
        'Content-Type' : 'application/json',
        port: 5990,
        path: '/v1/payments',
        method:'POST'
    };
    var people = {};
    people.rook2pawn = 'rwUNHL9AdSupre4tGb7NXZpRS1ift5sR7W';
    people.rook2pawn_gw = 'rpzgG7yxjEP9EHf2roftLvPTvt4wfL3iYY';
    console.log(process.env);
    var payment = {
        "secret": process.env.SECRET_SENDER,
        "client_resource_id": generateUUID(),
        "payment": {
            "source_account": people.rook2pawn,
            "destination_account": people.rook2pawn_gw,
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

        // we expect to get back a HTTP 
        // response such that content-type: application/json
        // and a corresponding json body
        //console.log(res.headers);
        
        var body = "";
        res.setEncoding('utf8');
        res.on('data',function(chunk) {
            body = body.concat(chunk);
        });
        res.on('end',function() {
            var obj; 
            console.log("1. Checking the response after posting payment that it is valid json");
            test.doesNotThrow(function() {
                obj = JSON.parse(body)
            });
            if (obj !== null) {
                console.log("2. Test that the success flag is there");
                test.ok(obj.success, "this assertion should pass");
                console.log("3. Test that the same UUID posted is returned");
                console.log(obj);
                test.ok(obj.client_resource_id == payment.client_resource_id, "this assertion should pass");
                GLOBALS.uuid = payment.client_resource_id;
                GLOBALS.accountid = people.rook2pawn;
            }
            test.done();
        });
    });
    req.write(JSON.stringify(payment));
    req.end();
};
exports.testMakePayment = payments;
var testPaymentDetail = function(test) {
    console.log("testPaymentDetail");
    test.expect(2);
    console.log("\nGET /v1/accounts/{account}/payments/{hash,client_resource_id}");
    var connectobj = {
        hostname:'localhost',
        port: 5990,
        path: '/v1/accounts/' + GLOBALS.accountid + '/payments/' + GLOBALS.uuid,
        method:'GET'
    };
    var req = http.request(connectobj,function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body = body.concat(chunk);
        });
        res.on('end',function() {
            console.log("1. test valid JSON response")
            var obj;
            test.doesNotThrow(function() {
                obj = JSON.parse(body)
            });
            if (obj !== undefined) {
                console.log(obj);
                console.log("2. Test that the success flag is there");
                test.ok(obj.success, "this assertion should pass");
                if ((obj.payment) && (obj.payment.hash)) {
                    GLOBALS.paymenthash = obj.payment.hash;
                }
            }
            test.done();
        });
    });
    req.end();
};
exports.testPaymentDetail = testPaymentDetail;


// i think test is correct but only fails because
// the endpoint at the hash is not written by the time the response is
// given... will cause rest server to fail
/*
  info 03-18 20:35 [server.js] url is : /v1/tx/679437006A1C88ACF26FC426961B3DD5F7690E3B1E8BA24AF1268B308906E9C4

/home/rook/ripple-rest/lib/tx-lib.js:43
        tx.date = res.ledger.close_time;
                            ^
TypeError: Cannot read property 'close_time' of undefined
    at Request.<anonymous> (/home/rook/ripple-rest/lib/tx-lib.js:43:29)
    at Request.request_success (/home/rook/ripple-rest/node_modules/ripple-lib/src/js/ripple/request.js:60:16)
    at Request.g (events.js:180:16)
    at Request.EventEmitter.emit (events.js:95:17)
*/
/*
var testGetPaymentDetailByHash = function(test) {
    console.log("testGetPaymentDetailByHash");
    test.expect(3);
    console.log(GLOBALS);
    var connectobj = {
        hostname:'localhost',
        port: 5990,
        path: '/v1/tx/' + GLOBALS.paymenthash,
        method:'GET'
    };
    var req = http.request(connectobj,function(res) {
        console.log("connectobj:");console.log(connectobj);
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body = body.concat(chunk);
        });
        res.on('end',function() {
            console.log("1. test valid JSON response")
            var obj;
            test.doesNotThrow(function() {
                obj = JSON.parse(body)
            });
            if (obj !== undefined) {
                console.log(obj);
                console.log("2. Test that the success flag is there");
                test.ok(obj.success, "this assertion should pass");
                test.ok(obj.tx,"transaction object should be there");
            }
            test.done();
        });
    });
    req.end();
};
exports.testGetPaymentDetailByHash = testGetPaymentDetailByHash;
*/

exports.testUUID = function(test){
    console.log("\nGET /v1/uuid");
    test.expect(3);
    var connectobj = {
        hostname:'localhost',
        port: 5990,
        path: '/v1/uuid',
        method:'GET'
    };
    var req = http.request(connectobj,function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body = body.concat(chunk);
        });
        res.on('end',function() {
            var obj; 
            console.log("1. test UUID is returned as valid json");
            test.doesNotThrow(function() {
                obj = JSON.parse(body)
            });
            if (obj !== undefined) {
                console.log("2. test that UUID request is success");
                test.ok(obj.success, "this assertion should pass");
                console.log("3. test that UUID length >= 32");
                test.ok(obj.uuid.length >= 32, "this assertion should pass");
            }
            test.done();
        });
    }); 
    req.end();
};
