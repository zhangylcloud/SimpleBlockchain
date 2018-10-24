/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  //Initialize blockchain
  async initialize(){
    console.log("Start initializing blockchain object");
    let height = await this.getBlockHeight();
    if(height == -1){
      console.log("Creating genesis block");
      await this.addBlock(new Block("GenesisBlock"))
      console.log("Create Genesis block done");
    }
    console.log("Done initializing blockchain object");
  }  

  // Add new block
  async addBlock(newBlock){
    let curBlockHeight = await this.getBlockHeight();

    // Check if Genesis block exist, if not, create it
    if(curBlockHeight == -1 && newBlock.body == "GenesisBlock"){
      let newBlock = new Block("GenesisBlock");
      newBlock.previousBlockHash = "";
      newBlock.height = 0;
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      return await db.put(newBlock.height, JSON.stringify(newBlock));
    }
    else if(curBlockHeight == -1 && newBlock.body != "GenesisBlock"){
      await this.addBlock(new Block("GenesisBlock"));
      curBlockHeight = 0;
    }

    //Get the current last block's height and block itself
    let curBlock = JSON.parse(await this.getBlock(curBlockHeight));
    newBlock.height = curBlockHeight + 1;
    // UTC timestam
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    newBlock.previousBlockHash = curBlock.hash;
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    console.log("New block is ");
    console.log(newBlock);

    // Adding block object to chain
    await db.put(newBlock.height, JSON.stringify(newBlock));
    console.log("New block added");
    return
  }

  // Get block height
  async getBlockHeight(){
    let height = -1;
    return await new Promise(function(resolve, reject){
      db.createReadStream().on('data', function(data){
        height++;
      }).on('end', function(){
        resolve(height);
      });
    });
  }

  async getBlock(key){
    return await db.get(key);
  } 

  // validate block
  async validateBlock(blockHeight){
    // get block object
    let block = JSON.parse(await this.getBlock(blockHeight));
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash===validBlockHash) {
        return true;
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
      }
  }

  // Validate blockchain
  async validateChain(){
    let height = await this.getBlockHeight();
    let errorLog = [];
    for (var i = 0; i < height; i++) {
      // validate block
      let validateBlockResult = await this.validateBlock(i);
      if (!validateBlockResult){
        errorLog.push(i);
      }
      // compare blocks hash link
      let block = JSON.parse(await this.getBlock(i));
      let blockHash = block.hash;
      let nextBlock = JSON.parse(await this.getBlock(i+1));
      let nextBlockPreviousHash = nextBlock.previousBlockHash;
      if (blockHash !== nextBlockPreviousHash) {
        errorLog.push(i);
      }
    }
    //Still need to validate the last block, which is not validated in for loop above
    let validateBlockResult = JSON.parse(await this.validateBlock(height));
    if (!validateBlockResult){
      errorLog.push(i);
    }
    
    if (errorLog.length>0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+ errorLog);
      return false;
    } 
    else {
      console.log('No errors detected');
      return true;
    }
  }

  //For introducing error for testing
  async updateBlock(index, value){
    let block = JSON.parse(await this.getBlock(index));
    block.body = value;
    await db.put(index, JSON.stringify(block));
    console.log("updated block " + index + " to ");
    console.log(block);
  }
  
  //For testing purpose
  async printBlockChain(){
    console.log("Printing blockchain");
    return new Promise(function(resolve, reject){
      db.createReadStream().on('data', console.log).on('end', function(){
        console.log("Done printing");
        resolve();
      });
    });
  }
}

/* ===== Tester ==============================
|  Blockchain Test function 			            |
|  ===============================================*/
async function testBlockChain(){
  let NumTestBlock = 10;
  let blockchain = new Blockchain();

  await blockchain.initialize();

  for(let i = 0; i < NumTestBlock; ++i){
    await blockchain.addBlock(new Block(makeRandomStr()));
  }

  await blockchain.printBlockChain();

  let curBlockHeight = await blockchain.getBlockHeight();
  console.log("Current blockchain height is " + curBlockHeight);

  let curBlock = await blockchain.getBlock(curBlockHeight);
  console.log("Current block (last block) is ");
  console.log(curBlock);

  let validateBlockRes = await blockchain.validateBlock(curBlockHeight);
  console.log("validate Block Result is " + validateBlockRes);

  let validateChainRes = await blockchain.validateChain();
  console.log("validate Chain Result is " + validateChainRes);
}

async function testError(){
  //let NumTestBlock = 3;
  let blockchain = new Blockchain();

  await blockchain.initialize();

  //for(let i = 0; i < NumTestBlock; ++i){
    //await blockchain.addBlock(new Block(makeRandomStr()));
  //}

  await blockchain.printBlockChain();

  await blockchain.updateBlock(3, "Haha Gotcha");

  await blockchain.printBlockChain();

  let validateChainRes = await blockchain.validateChain();
  console.log("validate Chain Result is " + validateChainRes);
}

async function tester(){
  await testBlockChain();
  await testError();
}

tester();

function makeRandomStr() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}



