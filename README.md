# CoinLocking SpartanGold

Coin-locking is an approach designed to provide "free" transactions by allowing clients to lock their coins to generate pre-paid interest as a reward for miners.  Clients maintain ownership of their coins, but sacrifice liquidity in order to generate rewards.

This mechanism can also be used to generate money for other clients, or other services on the blockchain.  Essentially, clients can buy coins as a rough stand-in for a service rate.  However, the amount of service their coins will buy depends on the current market price of the coins.

In contrast, Bitcoin has two different reward mechanisms: the coinbase transaction minting new money for the winning miner, and transaction fees for the clients.  Coin-locking combines these mechanisms, offering the benefits of both.

Note that coins can still be spent in the usual manner.

This code base is built on top of SpartanGold, a simplified blockchain-based cryptocurrency for education and experimentation.  For more details about SpartanGold, see
[the SpartanGold github page](https://github.com/taustin/spartan-gold/)

For more details on the coin-locking model, refer to [the original DAPPCON paper](https://ieeexplore.ieee.org/document/8783004).  Note that in the original paper, we referred to this model as the "token-locking model to be consistent with the terminology used for the [0chain blockchain](https://0chain.net/).

## Using SpartanGold

There are two different approaches for running SpartanGold:

1. In *single-threaded mode*, multiple miners and clients can run within the same JavaScript process.
1. Using TcpMiner, the SpartanGold code runs within different JavaScript processes.

### Single-threaded Mode

This mode is designed for quick and easy experimentation, avoiding a lot of unnecessary complexity.

To see an example, run driver.js from the command line:

``
$ node driver.js
``

This script has two miners, *Minnie* and *Mickey*, along with three additional non-mining clients.

In this script, Alice writes 2 transactions.  In the first, she gives coins to Bob and offers coins as a transaction fee, following the standard model used in Bitcoin.  In the second, Alice instead locks funds to generate interest given to Charlie, and locks additional funds as a mining reward.  The balances are displayed both after locking and after unlocking.  (Note that the timeout values may need to be adjusted for your system).

### Multi-process Mode

In this mode, each SpartanGold miner runs in its own JavaScript process.  All miners run on `localhost` and specify a port at the command line.

To start a miner on localhost, port 9000:

``
$ node tcpMiner.js 9000
``

This presents a text-based menu, including information about the miner's address, its current funds, and any outstanding transactions that it has.  Here is an example:

``` fundamental
Starting Miner9000

  Funds: 0
  Address: 6w6/Z2hWMxJPBDsUM83hM1P2x/hhAtX0i4CZ92os+Kg=
  Pending transactions: 
  
  What would you like to do?
  *(c)onnect to miner?
  *(t)ransfer funds?
  *(r)esend pending transactions?
  *show (b)alances?
  *show blocks for (d)ebugging and exit?
  *e(x)it?
  
  Your choice:
```

In a separate process, you can start an additional miner on another port.  The miner will register with miners at any additional ports listed.  For instance, to start a miner on port 9001 that will connect with the miner on port 9000, run:

``
$ node tcpMiner.js 9001 9000
``

The two miners will now race to find proofs, sending their blocks back and forth.

While this mode is a little more complex, it creates a more realistic feel, and takes away some possible "cheats" that you can get away with in single-threaded mode.

