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

// Late miner - Donald has more mining power, represented by the miningRounds.
// (Mickey and Minnie have the default of 2000 rounds).
//let donald = new LockingMiner({name: "Donald", net: fakeNet, startingBlock: genesis, miningRounds: 3000});

function showBalances(client) {
  console.log(`Alice has ${client.lastBlock.balanceOf(alice.address)} gold, with ${client.lastBlock.lockedGold(alice.address)} gold locked.`);
  console.log(`Bob has ${client.lastBlock.balanceOf(bob.address)} gold.`);
  console.log(`Charlie has ${client.lastBlock.balanceOf(charlie.address)} gold.`);
  console.log(`Minnie has ${client.lastBlock.balanceOf(minnie.address)} gold.`);
  console.log(`Mickey has ${client.lastBlock.balanceOf(mickey.address)} gold.`);
  //console.log(`Donald has ${client.lastBlock.balanceOf(donald.address)} gold.`);
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

//setTimeout(() => {
//  console.log();
//  console.log("***Starting a late-to-the-party miner***");
//  console.log();
//  fakeNet.register(donald);
//  donald.initialize();
//}, 2000);

// Print out the final balances after it has been running for some time.
setTimeout(() => {
  //console.log();
  //console.log(`Minnie has a chain of length ${minnie.currentBlock.chainLength}:`);

  //console.log();
  //console.log(`Mickey has a chain of length ${mickey.currentBlock.chainLength}:`);

  //console.log();
  //console.log(`Donald has a chain of length ${donald.currentBlock.chainLength}:`);

  console.log();
  console.log("Final balances (Minnie's perspective):");
  showBalances(minnie);

  //console.log();
  //console.log("Final balances (Alice's perspective):");
  //showBalances(alice);

  //console.log();
  //console.log("Final balances (Donald's perspective):");
  //showBalances(donald);

  process.exit(0);
}, 5000);
