var _                = require('lodash');
var bignum           = require('bignumber.js');
var ripple           = require('ripple-lib');
var utils            = require('../utils');
var validator        = require('../schema-validator');


function orderIsValid(order, callback) {

  if (!order.account) {
    callback(new Error('Missing parameter: account.' +
      ' Must be a valid Ripple Address'));
    return;
  }

  if (validator.validate(order.account, 'RippleAddress').length > 0) {
    callback(new Error('Invalid parameter: account.' +
      ' Must be a valid Ripple Address'));
    return;
  }

  if (!order.hasOwnProperty('is_bid')) {
    callback(new Error('Missing parameter: is_bid.' +
      ' Boolean required to determined whether order is a bid or an ask'));
    return; 
  }

  if (typeof order.is_bid !== 'boolean') {
    callback(new Error('Invalid parameter: is_bid.' +
      ' Boolean required to determined whether order is a bid or an ask'));
    return;
  }

  /* Amounts and exchange rate */

  if (!order.base_amount) {
    callback(new Error('Missing parameter: base_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (typeof order.base_amount !== 'object' || 
    validator.validate(order.base_amount.currency, 'Currency').length > 0 ||
    ((order.base_amount.currency === 'XRP' && order.base_amount.issuer) ||
      order.base_amount.currency !== 'XRP' && validator.validate(order.base_amount.issuer, 'RippleAddress').length > 0)) {
    callback(new Error('Invalid parameter: base_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

    if (!order.counter_amount) {
    callback(new Error('Missing parameter: counter_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (typeof order.counter_amount !== 'object' || 
    validator.validate(order.counter_amount.currency, 'Currency').length > 0 ||
    ((order.counter_amount.currency === 'XRP' && order.counter_amount.issuer) ||
      order.counter_amount.currency !== 'XRP' && validator.validate(order.counter_amount.issuer, 'RippleAddress').length > 0)) {
    callback(new Error('Invalid parameter: counter_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (order.exchange_rate && validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Invalid parameter: exchange_rate.' +
      ' Must be a string representation of a floating point number'));
    return;
  }

  // Either base_amount.value or counter_amount.value can be omitted if exchange_rate is supplied
  // Note that this will accept amount values as strings or numbers
  if ((!order.base_amount.value || 
    validator.validate('' + order.base_amount.value, 'FloatString').length > 0) &&
      validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Must supply base_amount and counter_amount complete with values for each.' +
      ' One of the amount value fields may be omitted if exchange_rate is supplied'));
    return;
  }
  if ((!order.counter_amount.value || 
    validator.validate('' + order.counter_amount.value, 'FloatString').length > 0) &&
      validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Must supply base_amount and counter_amount complete with values for each.' +
      ' One of the amount value fields may be omitted if exchange_rate is supplied'));
    return;
  }

  /* Optional fields */

  if (order.expiration_timestamp && 
    validator.validate(order.expiration_timestamp, 'Timestamp').length > 0) {
    callback(new Error('Invalid parameter: expiration_timestamp. Must be a valid timestamp'));
    return;
  }

  // ledger_timeout must be a string or numerical representation of a positive integer
  if (order.ledger_timeout && 
    (validator.validate('' + order.ledger_timeout, 'FloatString').length > 0 ||
      parseFloat(order.ledger_timeout) !== parseInt(order.ledger_timeout) ||
      parseInt(order.ledger_timeout) < 0)) {
    callback(new Error('Invalid parameter: ledger_timeout. Must be a positive integer'));
  return;
  }

  if (order.hasOwnProperty('immediate_or_cancel') && 
    typeof order.immediate_or_cancel !== 'boolean') {
    callback(new Error('Invalid parameter: immediate_or_cancel. Must be a boolean'));
  return;
  }

  if (order.hasOwnProperty('fill_or_kill') && 
    typeof order.fill_or_kill !== 'boolean') {
    callback(new Error('Invalid parameter: fill_or_kill. Must be a boolean'));
  return;
  }  

  if (order.hasOwnProperty('maximize_buy_or_sell') && 
    typeof order.maximize_buy_or_sell !== 'boolean') {
    callback(new Error('Invalid parameter: maximize_buy_or_sell. Must be a boolean'));
  return;
  }  
  
  // cancel_replace must be a string or numerical representation of a positive integer
  if (order.cancel_replace && 
    (validator.validate('' + order.cancel_replace, 'FloatString').length > 0 ||
      parseFloat(order.cancel_replace) !== parseInt(order.cancel_replace) ||
      parseInt(order.cancel_replace) < 0)) {
    callback(new Error('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace'));
  return;
  }

  callback(null, true);
}

module.exports.orderIsValid = orderIsValid;