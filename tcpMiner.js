const net = require('net');
const readline = require('readline');

const FakeNet = require('./fakeNet.js');
const Blockchain = require('./blockchain.js');
const LockingBlock = require('./locking-block.js');
const LockingMiner = require('./locking-miner.js');
const LockingTransaction = require('./locking-transaction.js');

/**
 * This extends the FakeNet class to actually communicate over the network.
 */
class TcpNet extends FakeNet {
  sendMessage(address, msg, o) {
    if (typeof o === 'string') o = JSON.parse(o);
    let data = {msg, o};
    const client = this.clients.get(address);
    let clientConnection = net.connect(client.connection, () => {
      clientConnection.write(JSON.stringify(data));
    });
  }

}

/**
 * Provides a command line interface for a SpartanGold miner
 * that will actually communicate over the network.
 */
class TcpMiner extends LockingMiner {
  static get REGISTER() { return "REGISTER"; }

  /**
   * In addition to the usual properties for a miner, the constructor
   * also takes a JSON object for the connection information and sets
   * up a listener to listen for incoming connections.
   */
  constructor({name, startingBlock, miningRounds, connection} = {}) {
    super({name, net: new TcpNet(), startingBlock, miningRounds});

    // Setting up the server to listen for connections
    this.connection = connection;
    this.srvr = net.createServer();
    this.srvr.on('connection', (client) => {
      this.log('Received connection');
      client.on('data', (data) => {
        let {msg, o} = JSON.parse(data);
        if (msg === TcpMiner.REGISTER) {
          if (!this.net.recognizes(o)) {
            this.registerWith(o.connection);
          }
          this.log(`Registering ${JSON.stringify(o)}`);
          this.net.register(o);
        } else {
          this.emit(msg, o);
        }
      });
    });
  }

  /**
   * Connects with the miner specified using the connection details provided.
   * 
   * @param {Object} minerConnection - The connection information for the other miner.
   */
  registerWith(minerConnection) {
    this.log(`Connection: ${JSON.stringify(minerConnection)}`);
    let conn = net.connect(minerConnection, () => {
      let data = {
        msg: TcpMiner.REGISTER,
        o: {
          name: this.name,
          address: this.address,
          connection: this.connection,
        }
      };
      conn.write(JSON.stringify(data));
    });
  }

  /**
   * Begins mining and registers with any known miners.
   */
  initialize(...knownMinerConnections) {
    super.initialize();
    this.srvr.listen(this.connection.port);
    for (let m of knownMinerConnections) {
      this.registerWith(m);
    }
  }

  /**
   * Prints out a list of any pending outgoing transactions.
   */
  showPendingOut() {
    let s = "";
    this.pendingOutgoingTransactions.forEach((tx) => {
      s += `\n    id:${tx.id} nonce:${tx.nonce} totalOutput: ${tx.totalOutput()} totalLocked: ${tx.amountGoldLocked}\n`;
    });
    return s;
  }

}

if (process.argv.length < 3) {
  console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <port> [<known miner port> ...]`);
  process.exit();
}
let port = process.argv[2];
let conn = {port: port};
let name = `Miner${port}`;

let knownMiners = process.argv.slice(3);

let emptyGenesis = Blockchain.makeGenesis(new Map([]), {
  Block: LockingBlock,
  Transaction: LockingTransaction
});

console.log(`Starting ${name}`);
let minnie = new TcpMiner({name: name, connection: conn, startingBlock: emptyGenesis});

// Silencing the logging messages
minnie.log = function(){};

// Register with known miners and begin mining.
minnie.initialize(...knownMiners);

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function readUserInput() {
  rl.question(`
  Funds: ${minnie.availableGold}
  Locked Gold: ${minnie.lockedGold()}
  Address: ${minnie.address}
  Pending transactions: ${minnie.showPendingOut()}
  
  What would you like to do?
  *(c)onnect to miner?
  *(t)ransfer funds?
  *(l)ock funds to generate gold?
  *(r)esend pending transactions?
  *show (b)alances?
  *show blocks for (d)ebugging and exit?
  *e(x)it?
  
  Your choice: `, (answer) => {
    console.clear();
    switch (answer.trim().toLowerCase()) {
      case 'x':
        console.log(`Shutting down.  Have a nice day.`);
        process.exit(0);
        /* falls through */
      case 'b':
        console.log("  Balances: ");
        minnie.showAllBalances();
        break;
      case 'c':
        rl.question(`  port: `, (p) => {
          minnie.registerWith({port: p});
          console.log(`Registering with miner at port ${p}`);
          readUserInput();
        });
        break;
      case 't':
        rl.question(`  amount: `, (amt) => {
          amt = parseInt(amt);
          if (amt > minnie.availableGold) {
            console.log(`***Insufficient gold.  You only have ${minnie.availableGold}.`);
          } else {
            rl.question(`  address: `, (addr) => {
              let output = {amount: amt, address: addr};
              console.log(`Transferring ${amt} gold to ${addr}.`);
              minnie.postTransaction([output]);
              readUserInput();
            });
          }
        });
        break;
      case 'l':
        rl.question(`  amount to lock: `, (amt) => {
          amt = parseInt(amt);
          if (amt > minnie.availableGold) {
            console.log(`***Insufficient gold.  You only have ${minnie.availableGold}.`);
          } else {
            rl.question(`  address to give generated interest: `, (addr) => {
              let output = {amount: amt, address: addr};
              console.log(`Locking ${amt} gold to generate ${LockingTransaction.goldGenerated(amt)} gold for ${addr}.`);
              minnie.postLockingTransaction([output]);
              readUserInput();
            });
          }
        });
        break;
      case 'r':
        minnie.resendPendingTransactions();
        break;
      case 'd':
        minnie.blocks.forEach((block) => {
          let s = "";
          block.transactions.forEach((tx) => s += `${tx.id} `);
          if (s !== "") console.log(`${block.id} transactions: ${s}`);
        });
        console.log();
        minnie.showBlockchain();
        process.exit(0);
        /* falls through */
      default:
        console.log(`Unrecognized choice: ${answer}`);
    }
    console.log();
    setTimeout(readUserInput, 0);
  });
}

readUserInput();

