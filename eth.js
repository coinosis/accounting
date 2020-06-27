const { etherscanKey } = require('./settings.json');

const url = new URL('https://api.etherscan.io/api');
const params = {
  module: 'account',
  action: 'txlist',
  address,
  startblock: 0,
  endblock: 99999999,
  sort: 'asc',
  apikey: etherscanKey,
};
