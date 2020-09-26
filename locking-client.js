"use strict";

const Client = require('./client.js');

const lockingMixin = require('./locking-mixin.js');

module.exports = class LockingClient extends Client {

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
    return super.availableGold - this.lockedGold();
  }

};
