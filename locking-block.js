"use strict";

const Block = require('./block.js');
const LockingTransaction = require('./locking-transaction.js');

module.exports = class LockingBlock extends Block {

  constructor(rewardAddr, prevBlock, target, coinbaseReward) {
    super(rewardAddr, prevBlock, target, coinbaseReward);

    this.lockedFunds = (prevBlock && prevBlock.lockedFunds) ? new Map(prevBlock.lockedFunds) : new Map();

    this.BlockClass = LockingBlock;
    this.TransactionClass = LockingTransaction;
  }

  /**
   * 
   * @param {LockingTransaction} tx - A locking transaction.
   * @param {LockingClient} client - Used for printing debug messages.
   * 
   * @returns Success of adding transaction to the block.
   */
  addTransaction(tx, client) {
    if (!super.addTransaction(tx, client)) return false;

    // Updating amount of locked gold.
    let goldLocked = this.lockedGold(tx.from);
    this.lockedFunds.set(tx.from, goldLocked + tx.amountGoldLocked);

    console.log(`Gold locked: ${goldLocked}; tx locked: ${tx.amountGoldLocked}`);

    // TODO: Make sure that lockingFee goes to the right place

    // Giving generated reward to outputs.
    if (tx.data.lockingOutputs) tx.data.lockingOutputs.forEach(({amount, address}) => {
      let receiverBalance = this.balances.get(address);
      let minted = LockingTransaction.goldGenerated(amount);
      this.balances.set(address, receiverBalance + minted);
    });

    // Transaction added successfully.
    return true;
  }

   /**
   * The total amount of gold paid to the miner who produced this block,
   * if the block is accepted.  This includes both the coinbase transaction
   * and any transaction fees, as well as any generated gold created by
   * locking tokens.
   * 
   * @returns {Number} Total reward in gold for the user.
   * 
   */
  totalRewards() {
    // Note that super.totalRewards will return the standard spartanGold rewards.
    return [...this.transactions].reduce(
      (reward, [, tx]) => reward + LockingTransaction.goldGenerated(tx.data.lockingFee),
      super.totalRewards());
  }

  lockedGold(addr) {
    return this.lockedFunds.get(addr) || 0;
  }

  rerun(prevBlock) {
    // For this version need to track locked funds as well.
    this.lockedFunds = new Map(prevBlock.lockedFunds);

    return super.rerun(prevBlock);
  }

};