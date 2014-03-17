var util = require('util');
var Remote = require('ripple-lib').Remote;
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
remote.connect(function() {
    remote.request_account_info('rwUNHL9AdSupre4tGb7NXZpRS1ift5sR7W',
});
var log = function(obj) {
    console.log(util.inspect(obj, { showHidden: true, depth: null }));
};
// Test 
var http = require('http');
// shared GLOBALS between tests
var GLOBALS = { uuid: undefined };
var PEOPLE = {};
PEOPLE.rook2pawn = 'rwUNHL9AdSupre4tGb7NXZpRS1ift5sR7W';
PEOPLE.rook2pawn_gw = 'rpzgG7yxjEP9EHf2roftLvPTvt4wfL3iYY';
PEOPLE.rook2pawn_mm = 'rpXF7z1sypK41CFhFzNHczSE47w8rGLx7W';
PEOPLE.rook2pawn_receiver = 'rp4GSjosE4TrPvmmfxFhu2Awf7BQn4dQoH';

var usecase1 = function(test) {
    console.log("Use Case 1:");
    console.log("XRP to XRP");
  
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
    var payment = {
        "secret": "shDiLVUXYGFDCoMDP6HfHnER5dpmP",
        "client_resource_id": generateUUID(),
        "payment": {
            "source_account": PEOPLE.rook2pawn,
            "destination_account": PEOPLE.rook2pawn_receiver,
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
                test.ok((obj.client_resource_id === payment.client_resource_id), "this assertion should pass");
                console.log("tttttttt");
                GLOBALS.uuid = payment.client_resource_id;
                GLOBALS.accountid = PEOPLE.rook2pawn;

                console.log("\n\nThis is the response:");console.log(obj);
            }
            console.log("about to call DONE");
            test.done();
        });
    });
    req.write(JSON.stringify(payment));
    req.end();
};
exports.usecase1 = usecase1;
