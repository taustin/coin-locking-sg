"use strict";

const Block = require('./block.js');
const LockingTransaction = require('./locking-transaction.js');

const LOCK_DURATION_ROUNDS = 35;

module.exports = class LockingBlock extends Block {

  constructor(rewardAddr, prevBlock, target, coinbaseReward) {
    super(rewardAddr, prevBlock, target, coinbaseReward);

    // Tracking current balances of locked gold:  clientID -> totalAmount
    this.lockedFunds = (prevBlock && prevBlock.lockedFunds) ? new Map(prevBlock.lockedFunds) : new Map();

    // Tracking when to unlock gold:  blockLocked -> [{ clientID, amount }]
    this.unlockingEvents = (prevBlock && prevBlock.unlockingEvents) ? new Map(prevBlock.unlockingEvents) : new Map();

    this.unlockFunds();

    this.BlockClass = LockingBlock;
    this.TransactionClass = LockingTransaction;
  }

  /**
   * After a fixed number of blocks have passed, locked gold becomes unlocked again.
   */
  unlockFunds() {
    // Updating locked gold balances if the locking time has elapsed.
    if (this.unlockingEvents.has(this.chainLength)) {
      let q = this.unlockingEvents.get(this.chainLength);
      q.forEach(({clientID, amount}) => {
        let totalLocked = this.lockedFunds.get(clientID);
        this.lockedFunds.set(clientID, totalLocked - amount);
      });

      // No longer need to track these locking events.
      this.unlockingEvents.delete(this.chainLength);
    }

  }

  /**
   * This method extends the parent method with support for gold locking transactions.
   * 
   * @param {LockingTransaction} tx - A locking transaction.
   * @param {LockingClient} client - Used for printing debug messages.
   * 
   * @returns Success of adding transaction to the block.
   */
  addTransaction(tx, client) {
    if (!super.addTransaction(tx, client)) return false;

    // Updating amount of locked gold, if there was any locking.
    if (tx.amountGoldLocked > 0) {
      let goldLocked = this.lockedGold(tx.from);
      this.lockedFunds.set(tx.from, goldLocked + tx.amountGoldLocked);

      // tracking when to unlock gold
      let unlockingRound = this.chainLength + LOCK_DURATION_ROUNDS;
      let q = this.unlockingEvents.get(unlockingRound) || [];
      q.push({clientID: tx.from, amount: tx.amountGoldLocked});
      this.unlockingEvents.set(unlockingRound, q);

      // Giving generated reward to outputs.
      if (tx.data.lockingOutputs) tx.data.lockingOutputs.forEach(({amount, address}) => {
        let receiverBalance = this.balances.get(address) || 0;
        let minted = LockingTransaction.goldGenerated(amount);
        this.balances.set(address, receiverBalance + minted);
      });
    }

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
      (reward, [, tx]) => {
        let lockingReward = tx.data.lockingFee ? LockingTransaction.goldGenerated(tx.data.lockingFee) : 0;
        return reward + lockingReward;
      },
      super.totalRewards());
  }

  /**
   * Looks up the amount of gold locked for the specified client.
   * 
   * @param {String} addr - Address of the client.
   * @returns {Number} Amount of the client's gold that is currently locked.
   */
  lockedGold(addr) {
    return this.lockedFunds.get(addr) || 0;
  }

  /**
   * When rerunning a locking block, we must also replaying any gold
   * locking/unlocking events.
   * 
   * @param {Block} prevBlock - The previous block in the blockchain, used for initial balances.
   * 
   * @returns {Boolean} - True if the block's transactions are all valid.
   */
  rerun(prevBlock) {
    // For coinLocking, we need to track locked funds and locking events as well.
    this.lockedFunds = new Map(prevBlock.lockedFunds);
    this.unlockingEvents = new Map(prevBlock.unlockingEvents);

    // Need to repeat any gold unlocking.
    this.unlockFunds();

    return super.rerun(prevBlock);
  }

};