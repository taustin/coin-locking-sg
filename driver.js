"use strict";

let Blockchain = require('./blockchain.js');
let LockingBlock = require('./locking-block.js');
let LockingClient = require('./locking-client.js');
let LockingMiner = require('./locking-miner.js');

let FakeNet = require('./fakeNet.js');

console.log("Starting simulation.  This may take a moment...");


let fakeNet = new FakeNet();

// Clients
let alice = new LockingClient({name: "Alice", net: fakeNet});
let bob = new LockingClient({name: "Bob", net: fakeNet});
let charlie = new LockingClient({name: "Charlie", net: fakeNet});

// Miners
let minnie = new LockingMiner({name: "Minnie", net: fakeNet});
let mickey = new LockingMiner({name: "Mickey", net: fakeNet});

// Creating genesis block
Blockchain.makeGenesis(new Map([
  [alice, 233],
  [bob, 99],
  [charlie, 67],
  [minnie, 400],
  [mickey, 300],
]), LockingBlock);

function showBalances(client) {
  console.log(`Alice has ${client.lastBlock.balanceOf(alice.address)} gold, with ${client.lastBlock.lockedGold(alice.address)} gold locked.`);
  console.log(`Bob has ${client.lastBlock.balanceOf(bob.address)} gold.`);
  console.log(`Charlie has ${client.lastBlock.balanceOf(charlie.address)} gold.`);
  console.log(`Minnie has ${client.lastBlock.balanceOf(minnie.address)} gold.`);
  console.log(`Mickey has ${client.lastBlock.balanceOf(mickey.address)} gold.`);
}

// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
showBalances(alice);

fakeNet.register(alice, bob, charlie, minnie, mickey);

// Miners start mining.
minnie.initialize();
mickey.initialize();

// Alice transfers some money to Bob.
console.log(`Alice is transferring 40 gold to ${bob.address}`);
alice.postTransaction([{ amount: 40, address: bob.address }]);

// Alice locks 40 gold to generate two gold as a transaction fee,
// and 100 gold to generate 5 gold for charlie.  These 140 gold become
// unspendable temporarily, but Alice does not lose them.
console.log(`Alice is locking 100 gold to reward ${charlie.address} with 20 gold, and locking 40 to reward miner with 2 gold.`);
alice.postLockingTransaction([{ amount: 100, address: charlie.address}], 40);

// Print out the balances before they should be unlocked. (Note that you may
// need to adjust the timout value based on your system.)
setTimeout(() => {

  console.log();
  console.log("====================================================");
  console.log("Balances after locking funds (Minnie's perspective):");
  showBalances(minnie);
  console.log("====================================================");
  console.log();
}, 5000);

// Print out the final balances after all funds have been unlocked
setTimeout(() => {

  console.log();
  console.log("====================================================");
  console.log("Final balances (Minnie's perspective):");
  showBalances(minnie);
  console.log("====================================================");

  process.exit(0);
}, 10000);