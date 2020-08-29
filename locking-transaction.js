"use strict";

const Transaction = require("./transaction.js");

// Using a float for representing the interest rate is not a great idea,
// but meh...
const LOCKING_INTEREST_RATE = 0.05;

module.exports = class LockingTransaction extends Transaction{
  static goldGenerated(amount) {
    return amount * LOCKING_INTEREST_RATE;
  }

  /**
   * Returns the total number of coins locked by the client, including the
   * coins offered as a reward to the miner and the coins locked to generate
   * coins for other clients.
   */
  get amountGoldLocked() {
    let lockingOutputs = this.data.lockingOutputs || [];
    return lockingOutputs.reduce(
      (totalLocked, {amount}) => totalLocked + amount,
      this.data.lockingFee || 0);
  }

  /**
   * Must verify that client has enough money NOT INCLUDING LOCKED FUNDS
   * for the total money spent AND the money that is set to be locked.
   * 
   * @param {LockingBlock} - The block used to check current balances.
   * 
   * @returns {boolean} True if there are sufficient funds for the transaction.
   */
  sufficientFunds(block) {
    let goldNeeded = this.totalOutput() + this.amountGoldLocked;
    let goldAvail = block.balanceOf(this.from) - block.lockedGold(this.from);
    return goldNeeded <= goldAvail;
  }

};
