"use strict";

const Miner = require('./miner.js');
const LockingClient = require('./locking-client.js');
const LockingBlock = require('./locking-block.js');
const LockingTransaction = require('./locking-transaction.js');

module.exports = class LockingMiner extends Miner {
  constructor(...args) {
    super(...args);

    // Adding postLockingTransaction method from the LockingClient class.
    this.postLockingTransaction = LockingClient.postLockingTransaction;

    this.BlockClass = LockingBlock;
    this.TransactionClass = LockingTransaction;
  }
};
