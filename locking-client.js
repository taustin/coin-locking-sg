"use strict";

let Blockchain = require('./blockchain.js');
let Client = require('./client.js');
let LockingTransaction = require('./locking-transaction.js');

//const DEFAULT_TX_LOCK_FEE = 20;

module.exports = class LockingClient extends Client {

  postLockingTransaction(outputs, fee=Blockchain.DEFAULT_TX_LOCK_FEE) {
    // We calculate the total value of gold needed.
    let totalPayments = outputs.reduce((acc, {amount}) => acc + amount, 0) + fee;

    // Make sure the client has enough gold.
    if (totalPayments > this.availableGold) {
      throw new Error(`Requested ${totalPayments}, but account only has ${this.balance}.`);
    }

    // Broadcasting the new transaction.
    let tx = new LockingTransaction({
      from: this.address,
      nonce: this.nonce,
      pubKey: this.keyPair.public,
      outputs: [],
      fee: 0,
      data: {
        lockingOutputs: outputs,
        lockingFee: fee,
      },
    });

    tx.sign(this.keyPair.private);

    // Adding transaction to pending.
    this.pendingOutgoingTransactions.set(tx.id, tx);

    this.nonce++;

    this.log(`Posting transaction ${tx.id}`);

    this.net.broadcast(Blockchain.POST_TRANSACTION, tx);
  }
};
