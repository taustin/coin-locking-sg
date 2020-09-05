"use strict";

const Miner = require('./miner.js');
const LockingClient = require('./locking-client.js');
const LockingBlock = require('./locking-block.js');
const LockingTransaction = require('./locking-transaction.js');

module.exports = class LockingMiner extends Miner {
  constructor(...args) {
    super(...args);

    // Adding methods from the LockingClient class.
    //this.postLockingTransaction = LockingClient.prototype.postLockingTransaction;
    this.plt = LockingClient.prototype.postLockingTransaction;
    this.lockedGold = LockingClient.prototype.lockedGold;
    this.showAllBalances = LockingClient.prototype.showAllBalances;

    this.BlockClass = LockingBlock;
    this.TransactionClass = LockingTransaction;
  }

  /**
   * In addition to the usual issues with determining what gold is available,
   * with the coin-locking model we must also consider how much gold is
   * currently locked.
   */
  get availableGold() {
    // FIXME: Repeated code from LockingClient version -- need to refactor away.
    return super.availableGold - this.lockedGold();
  }

  /**
   * When a miner posts a transaction, it must also add it to its current list of transactions.
   * 
   * @param  {...any} args - Arguments needed for Client.postTransaction.
   */
  postLockingTransaction(...args) {
    let tx = this.plt(...args);
    //let tx = LockingClient.prototype.postLockingTransaction.apply(this, ...args);
    this.addTransaction(tx);
  }

};
