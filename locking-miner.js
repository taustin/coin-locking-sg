"use strict";

const Miner = require('./miner.js');

const lockingMixin = require('./locking-mixin.js');

module.exports = class LockingMiner extends Miner {
  constructor(...args) {
    super(...args);

    Object.assign(this, lockingMixin);
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

};
