const fetch = require('node-fetch');
const web3Utils = require('web3-utils');
const { owlAddress, etherscanKey } = require('./settings.json');
const {
  isReceiving,
  isClapping,
  formatDate,
  extractAddress,
  getUserName,
  getEvent,
} = require('./utils.js');

const CURRENCY = 'xDAI';
const AUTHOR = 'macaw';
const etherscanURL = 'https://blockscout.com/poa/xdai/api';
const params = {
    module: 'account',
    action: 'txlist',
    address: owlAddress,
    startblock: 0,
    endblock: 99999999,
    sort: 'asc',
    apikey: etherscanKey,
  };

const fetcher = async () => {
  const url = new URL(etherscanURL);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response);
  }
  const data = await response.json();
  if (data.message !== 'OK') {
    throw new Error(data);
  }
  return data.result;
}

const getRecords = async () => {
  const records = [];
  const txList = await fetcher();
  for (const tx of txList) {
    if (tx.confirmations < 6) {
      continue;
    }
    const receiving = await isReceiving(tx.to);
    const clapping = isClapping(tx.input);
    const date = formatDate(tx.timeStamp);
    const event = receiving ? '' : await getEvent(tx.to);
    const userAddress = receiving ? tx.from : extractAddress(tx.input);
    const userName = await getUserName(userAddress) || userAddress;
    const creditReceiving = userName === 'deploy' ? 'activo' : 'pasivo';
    let description = receiving
    ? 'fund owl'
    : clapping
    ? 'aplausos'
    : 'inscripción saliente';
    if (tx.isError == '1') {
      description += ' (error)';
    }
    const txFeeWei = tx.gasUsed * tx.gasPrice;
    const txFee = web3Utils.fromWei(String(txFeeWei));
    const debit = receiving ? 'activo:owl' : 'gasto:cambio';
    const credit = receiving ? `${creditReceiving}:${userName}` : 'activo:owl';
    const record = {
      date,
      event,
      userName,
      description,
      amount: web3Utils.fromWei(tx.value),
      currency: CURRENCY,
      debit,
      credit,
      author: AUTHOR,
    };
    if (record.amount != 0 && tx.isError == '0') {
      records.push(record);
    }
    const feeRecord = {
      date,
      event,
      userName,
      description: `tarifa ${description}`,
      amount: txFee,
      currency: CURRENCY,
      debit: 'gasto:tarifas:xdai',
      credit,
      author: AUTHOR,
    };
    records.push(feeRecord);
  }
  return records;
}

module.exports = { getRecords };
