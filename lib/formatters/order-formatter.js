var _                        = require('lodash');
var bignum                   = require('bignumber.js');
var ripple                   = require('ripple-lib');
var utils                    = require('../utils');
var validator                = require('../schema-validator');
var config                   = require('../../config/config-loader');
var currency_prioritization  = config.get('currency_prioritization');
var currency_pair_exceptions = config.get('currency_pair_exceptions');

/**
 *  Validate an order in the ripple-rest format. Calls the
 *  callback with (null, true) if it is, responds with
 *  (error, null) otherwise
 */
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
    callback(new Error('Invalid parameter: expiration_timestamp.' +
      ' Must be a valid timestamp'));
    return;
  }

  // ledger_timeout must be a string or numerical representation of a positive integer
  if (order.ledger_timeout && 
    (validator.validate('' + order.ledger_timeout, 'FloatString').length > 0 ||
      parseFloat(order.ledger_timeout) !== parseInt(order.ledger_timeout) ||
      parseInt(order.ledger_timeout) < 0)) {
    callback(new Error('Invalid parameter: ledger_timeout.' +
      ' Must be a positive integer'));
  return;
  }

  if (order.hasOwnProperty('passive') && 
    typeof order.passive !== 'boolean') {
    callback(new Error('Invalid parameter: passive.' +
      ' Must be a boolean'));
  return;
  }

  if (order.hasOwnProperty('immediate_or_cancel') && 
    typeof order.immediate_or_cancel !== 'boolean') {
    callback(new Error('Invalid parameter: immediate_or_cancel.' +
      ' Must be a boolean'));
  return;
  }

  if (order.hasOwnProperty('fill_or_kill') && 
    typeof order.fill_or_kill !== 'boolean') {
    callback(new Error('Invalid parameter: fill_or_kill.' +
      ' Must be a boolean'));
  return;
  }  

  if (order.hasOwnProperty('maximize_buy_or_sell') && 
    typeof order.maximize_buy_or_sell !== 'boolean') {
    callback(new Error('Invalid parameter: maximize_buy_or_sell.' +
      ' Must be a boolean'));
  return;
  }  
  
  // cancel_replace must be a string or numerical representation of a positive integer
  if (order.cancel_replace && 
    (validator.validate('' + order.cancel_replace, 'FloatString').length > 0 ||
      parseFloat(order.cancel_replace) !== parseInt(order.cancel_replace) ||
      parseInt(order.cancel_replace) < 0)) {
    callback(new Error('Invalid parameter: cancel_replace.' +
      ' Must be a positive integer representing the sequence number of an order to replace'));
  return;
  }

  callback(null, true);
}

/**
 *  Parse an order from an OfferCreate, OfferCancel, or Payment transaction.
 *
 *  opts.account is required
 *  opts.sequence is optional
 */
function parseOrderFromTx(tx, opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  // Use currency_prioritization and currency_pair_exceptions from opts
  // if they are supplied, otherwise use values from config defined
  // at the top of the file
  var currency_prioritization, 
    currency_pair_exceptions; 
  if (opts) {
    if (opts.currency_prioritization) {
      currency_prioritization = opts.currency_prioritization;
    } else {
      currency_prioritization = currency_prioritization;
    }
    if (opts.currency_pair_exceptions) {
      currency_pair_exceptions = opts.currency_pair_exceptions;
    } else {
      currency_pair_exceptions = currency_pair_exceptions;
    }
  }

  var order = {};

  if (opts.account) {
    order.account = opts.account;
  } else {
    callback(new Error('Must supply opts.account to parse order'));
    return;
  }

  // Find the Offer entry amongst the meta.AffectedNodes
  if (!tx.meta) {
    callback(new Error('Transaction must have metadata to parse order'));
    return;
  }
  var offer_entry,
    final_fields,
    action;
  for (var an = 0; an < tx.meta.AffectedNodes.length; an++) {
    var affected_node = tx.meta.AffectedNodes[an],
      node = affected_node.CreatedNode || affected_node.ModifiedNode || affected_node.DeletedNode,
      fields;

    if (node.LedgerEntryType !== 'Offer') {
      continue;
    }

    fields = node.NewFields || node.FinalFields;

    if (fields.Account !== order.account) {
      continue;
    }

    if (opts.sequence && '' + opts.sequence !== '' + fields.Sequence) {
      continue;
    }

    offer_entry = node;
    final_fields = fields;
    if (affected_node.CreatedNode) {
      action = 'created';
    } else if (affected_node.ModifiedNode) {
      action = 'modified';
    } else if (affected_node.DeletedNode) {
      action = 'deleted';
    }
    break;
  }

  if (!offer_entry) {
    callback(new Error('Transaction does not contain order matching supplied parameters'));
    return;
  }

  // Parse exchange_rate from BookDirectory and correct for effects of XRP drops
  var book_directory_quality = ripple.Amount.from_quality(final_fields.BookDirectory).to_json().value;
  if (typeof final_fields.TakerGets === 'string') {
    book_directory_quality = bignum(book_directory_quality).times(1000000).toString();
  }
  if (typeof final_fields.TakerPays === 'string') {
    book_directory_quality = bignum(book_directory_quality).dividedBy(1000000).toString();
  }

  // Parse base_amount, counter_amount, is_bid, and exchange rate
  if (baseCurrencyIsTakerGets(final_fields.TakerGets, final_fields.TakerPays, {
    currency_prioritization: currency_prioritization, 
    currency_pair_exceptions: currency_pair_exceptions
  })) {

    order.is_bid = false;
    order.base_amount = formatAmount(final_fields.TakerGets);
    order.counter_amount = formatAmount(final_fields.TakerPays);
    order.exchange_rate = book_directory_quality;

  } else {

    order.is_bid = true;
    order.base_amount = formatAmount(final_fields.TakerPays);
    order.counter_amount = formatAmount(final_fields.TakerGets);
    order.exchange_rate = bignum(1).dividedBy(book_directory_quality).toString();
    
  }

  callback(null, order);
}

function formatAmount(amount) {

  if (typeof amount === 'string') {
    amount = {
      value: utils.dropsToXrp(amount),
      currency: 'XRP',
      issuer: ''
    };
  }

  amount.currency = amount.currency.toUpperCase();

  return amount;

}

/**
 *  Determines whether the TakerGets represents the base currency
 *  using the currency_prioritization and currency_pair_exceptions.
 *  Returns true if TakerGets is the "base currency", false otherwise
 *  Note that currency_prioritization and currency_pair_exceptions
 *  can be supplied as opts for testing purposes
 */
function baseCurrencyIsTakerGets(taker_gets, taker_pays, opts) {

  // Use currency_prioritization and currency_pair_exceptions from opts
  // if they are supplied, otherwise use values from config defined
  // at the top of the file
  var currency_prioritization, 
    currency_pair_exceptions; 
  if (opts) {
    if (opts.currency_prioritization) {
      currency_prioritization = opts.currency_prioritization;
    } else {
      currency_prioritization = currency_prioritization;
    }
    if (opts.currency_pair_exceptions) {
      currency_pair_exceptions = opts.currency_pair_exceptions;
    } else {
      currency_pair_exceptions = currency_pair_exceptions;
    }
  }

  // Format amounts
  taker_gets = formatAmount(taker_gets);
  taker_pays = formatAmount(taker_pays);

  // If both currencies are the same look at the issuer
  if (taker_pays.currency === taker_gets.currency) {
    return (taker_gets.issuer <= taker_pays.issuer);
  }

  // Look at exceptions list next
  // Note that exceptions are written as {base}/{counter}
  if (currency_pair_exceptions) {
    
    if (currency_pair_exceptions.indexOf(taker_gets.currency + '/' + taker_pays.currency) !== -1) {
      return true;
    }

    if (currency_pair_exceptions.indexOf(taker_pays.currency + '/' + taker_gets.currency) !== -1) {
      return false;
    }
  }

  // Next use currency_prioritization
  if (currency_prioritization) {

    if (currency_prioritization.indexOf(taker_gets.currency) !== -1 &&
      currency_prioritization.indexOf(taker_pays.currency) !== -1) {

      return (currency_prioritization.indexOf(taker_gets.currency) < 
        currency_prioritization.indexOf(taker_pays.currency));

    } else if (currency_prioritization.indexOf(taker_gets.currency) !== -1) {

      return true;

    } else if (currency_prioritization.indexOf(taker_pays.currency) !== -1) {

      return false;

    }

  }

  // Finally, use lexicographical order
  return taker_gets.currency <= taker_pays.currency;

}

module.exports.baseCurrencyIsTakerGets = baseCurrencyIsTakerGets;
module.exports.parseOrderFromTx        = parseOrderFromTx;
module.exports.orderIsValid            = orderIsValid;