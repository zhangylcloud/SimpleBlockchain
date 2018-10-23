/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

//LevelDB APIs
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

//SHA 256 APIs
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
  constructor(){
    this.chain = [];
    this.addBlock(new Block("Genesis block"));
  }

  // Add new block
  async addBlock(blockData){
    // Check if Genesis block exist, if not, create it
    if(blockData != "GenesisBlock"){
      try{
        await this.getBlock(0);
      }
      catch(error){
        if(error.type == 'NotFoundError'){
          console.log("genesis block does not exist, creating one");
          await this.addBlock("GenesisBlock");
        }
        else{
          console.log("Some error happened, returning");
          return;
        }
      }
    }
    
    //Get the current last block's height and block itself
    let curBlockHeight = await this.getBlockHeight(); 
    let curBlock = await this.getBlock(curBlockHeight);

    //Create new block
    let newBlock = new Block(blockData);
    newBlock.height = this.getBlockHeight() + 1;

    // UTC timestam
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(curBlockHeight > -1){
      newBlock.previousBlockHash = curBlock.hash;
    }

    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    // Adding block object to chain
    await db.put(newBlock.height, JSON.stringify(newBlock));
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
  validateBlock(blockHeight){
    // get block object
    let block = this.getBlock(blockHeight);
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
  validateChain(){
    let errorLog = [];
    for (var i = 0; i < this.chain.length-1; i++) {
      // validate block
      if (!this.validateBlock(i))errorLog.push(i);
      // compare blocks hash link
      let blockHash = this.chain[i].hash;
      let previousHash = this.chain[i+1].previousBlockHash;
      if (blockHash!==previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length>0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}

// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// Get data from levelDB with key
function getLevelDBData(key){
  db.get(key, function(err, value) {
    if (err) return console.log('Not found!', err);
    console.log('Value = ' + value);
  })
}

// Add data to levelDB with value
function addDataToLevelDB(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
}