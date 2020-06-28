if (process.argv.length < 3) {
  console.log(`usage: node macaw.js <file-path>`);
  process.exit();
}
const stringify = require('csv-stringify/lib/sync');
const db = require('../owl/src/db.js');
const payu = require('./payu.js');
const eth = require('./eth.js');

const dateSort = (a, b) => {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);
  return dateA - dateB;
}

const getRecords = async () => {

  const path = process.argv[2];
  const payuRecords = await payu.getRecords(path);
  const ethRecords = await eth.getRecords();
  const records = [ ...payuRecords, ...ethRecords ];
  const sortedRecords = records.sort(dateSort);
  const csv = stringify(sortedRecords);
  console.log(csv);
  db.disconnect();

}

getRecords();
