if (process.argv.length < 3) {
  console.log(`usage: node macaw.js <file-path>`);
  process.exit();
}
const stringify = require('csv-stringify/lib/sync');
const db = require('../owl/src/db.js');
const payu = require('./payu.js');
const eth = require('./eth.js');

const getRecords = async () => {

  const path = process.argv[2];
  const payuRecords = await payu.getRecords(path);
  const ethRecords = await eth.getRecords();
  console.log(payuRecords);
  console.log(ethRecords);
  db.disconnect();

}

getRecords();
