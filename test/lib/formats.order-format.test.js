/*jshint expr: true*/

var expect                = require('chai').expect;
var ripple                = require('ripple-lib');
var clone                 = require('clone');
var order_formatter    = require('../../lib/formatters/order-formatter');

var order_new_two_amounts = require('../testdata/order_new_two_amounts.json');

describe('lib/formatters/order-formatter', function(){

  describe('.orderIsValid()', function(){

    it('should respond with an error if account is missing or invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      delete order1.account;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: account. Must be a valid Ripple Address');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.account = 'notavalidaddress';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: account. Must be a valid Ripple Address');
        expect(is_valid).not.to.exist;
        done()
      });

    });

    it('should respond with an error if is_bid is missing or invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      delete order1.is_bid;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: is_bid. Boolean required to determined whether order is a bid or an ask');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.is_bid = 'true';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: is_bid. Boolean required to determined whether order is a bid or an ask');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if base_amount is missing or is invalid (note that value can be missing)', function(done){

      var order1 = clone(order_new_two_amounts);
      delete order1.base_amount;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.base_amount = {
        currency: 'USD'
      };
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(order_new_two_amounts);
      order3.base_amount = {
        currency: 'XRP',
        issuer: 'rsomegateway'
      };
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if counter_amount is missing or invalid (note that value can be missing)', function(done){

      var order1 = clone(order_new_two_amounts);
      delete order1.counter_amount;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.counter_amount = {
        currency: 'USD'
      };
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(order_new_two_amounts);
      order3.counter_amount = {
        currency: 'XRP',
        issuer: 'rsomegateway'
      };
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if exchange_rate is invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.exchange_rate = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: exchange_rate. Must be a string representation of a floating point number');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if less than two of i) base_amount.value ii) counter_amount.value iii) exchange_rate are specified', function(done){

      var order1 = clone(order_new_two_amounts);
      delete order1.base_amount.value;
      delete order1.exchange_rate;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Must supply base_amount and counter_amount complete with values for each. One of the amount value fields may be omitted if exchange_rate is supplied');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      delete order2.counter_amount.value;
      delete order2.exchange_rate;
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Must supply base_amount and counter_amount complete with values for each. One of the amount value fields may be omitted if exchange_rate is supplied');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if expiration_timestamp is not a valid timestamp', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.expiration_timestamp = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: expiration_timestamp. Must be a valid timestamp');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.expiration_timestamp = '1396876559';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: expiration_timestamp. Must be a valid timestamp');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if ledger_timeout is not a natural number', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.ledger_timeout = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(order_new_two_amounts);
      order2.ledger_timeout = '10.5';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(order_new_two_amounts);
      order3.ledger_timeout = '-10';
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if immediate_or_cancel is invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.immediate_or_cancel = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: immediate_or_cancel. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if fill_or_kill is invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.fill_or_kill = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: fill_or_kill. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if maximize_buy_or_sell is invalid', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.maximize_buy_or_sell = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: maximize_buy_or_sell. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if cancel_replace is not a natural number', function(){

      var order1 = clone(order_new_two_amounts);
      order1.cancel_replace = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

      var order2 = clone(order_new_two_amounts);
      order2.cancel_replace = '10.5';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

      var order3 = clone(order_new_two_amounts);
      order3.cancel_replace = '-10';
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

    });

    it('should properly validate a valid order', function(){

      order_formatter.orderIsValid(order_new_two_amounts, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

    });

    it('should properly validate an order with one amount value missing but exchange_rate supplied', function(){

      var order1 = clone(order_new_two_amounts);
      delete order1.base_amount.value;
      order1.exchange_rate = '0.10';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(order_new_two_amounts);
      delete order2.counter_amount.value;
      order2.exchange_rate = '10.0';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

    });

    it('should accept amount values as strings or numbers', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.base_amount.value = parseFloat(order1.base_amount.value);
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(order_new_two_amounts);
      order2.counter_amount.value = parseFloat(order2.counter_amount.value);
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
        done();
      });

    });

    it('should accept the ledger_timeout as a string or number', function(done){

      var order1 = clone(order_new_two_amounts);
      order1.ledger_timeout = '20';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(order_new_two_amounts);
      order2.ledger_timeout = 20;
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
        done();
      });

    });

  });

});