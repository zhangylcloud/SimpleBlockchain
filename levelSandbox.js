/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const simpleChain = require('./simpleChain.js');

module.exports = {
  // Add data to levelDB with key/value pair
  addLevelDBData : function(key,value){
    db.put(key, value, function(err) {
      if (err) {
        console.log('Block ' + key + ' submission failed', err);
        return err;
      }
      else{
        return "success";
      }
    })
  },

// Get data from levelDB with key
  getLevelDBData : function(key){
    db.get(key, function(err, value) {
      if (err){
        console.log('Not found!', err);
        return err;
      } 
      else{
        console.log('Value = ' + value);
        return "success";
      }
    })
  },

  // Add data to levelDB with value
  addDataToLevelDB : function(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            console.log('Unable to read data stream!', err)
            return err; 
        }).on('close', function() {
          console.log('Block #' + i);
          return addLevelDBData(i, value); //Potentially wrong, need check
        });
  },

  

  foo : function(){
    bar();
  }
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/


//(function theLoop (i) {
//  setTimeout(function () {
//    addDataToLevelDB('Testing data');
//    if (--i) theLoop(i);
//  }, 100);
//})(10);



//function foo(){
//  bar();
//}

function bar(){
  console.log("bar");
}
