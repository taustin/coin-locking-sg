"use strict";

const Miner = require('./miner.js');
const LockingClient = require('./locking-client.js');
const LockingBlock = require('./locking-block.js');
const LockingTransaction = require('./locking-transaction.js');

module.exports = class LockingMiner extends Miner {
  constructor(...args) {
    super(...args);

    // Changing methods inherited from client to use the LockingClient variant.
    this.postTransaction = LockingClient.postTransaction;

    this.BlockClass = LockingBlock;
    this.TransactionClass = LockingTransaction;
  }

  // Make sure that the prototype of the current block is correct.
  startNewSearch(address, lastBlock) {
    super.startNewSearch(address, lastBlock);
    //let lb = new LockingBlock();
    //this.currentBlock.__proto__ = lb.__proto__;
    this.currentBlock.lockedFunds = lastBlock ? new Map(lastBlock.lockedFunds) : new Map();
  }
};
