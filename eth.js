const fetch = require('node-fetch');
const web3Utils = require('web3-utils');
const { owlAddress, etherscanKey } = require('./settings.json');
const {
  isReceiving,
  isClapping,
  extractAddress,
  getUserName,
  getEvent,
} = require('./utils.js');
const db = require('../owl/src/db.js');

const CURRENCY = 'ETH';
const etherscanURL = 'https://api.etherscan.io/api';
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
    console.log(tx);
    if (tx.isError != '0') {
      throw new Error(tx);
    }
    const receiving = await isReceiving(tx.to);
    const clapping = isClapping(tx.input);
    const date = new Date(Number(tx.timeStamp) * 1000);
    const event = receiving ? '' : await getEvent(tx.to);
    const userAddress = receiving ? tx.from : extractAddress(tx.input);
    const userName = await getUserName(userAddress) || userAddress;
    const description = receiving
    ? 'fund owl'
    : clapping
    ? 'aplausos'
    : 'inscripción';
    const txFeeWei = tx.gasUsed * tx.gasPrice;
    const txFee = web3Utils.fromWei(String(txFeeWei));
    const debit = receiving ? 'activo:owl' : 'gasto:cambio:eth';
    const credit = receiving ? `pasivo:${userName}` : 'activo:owl';
    const record = {
      date,
      event,
      userName,
      description,
      amount: web3Utils.fromWei(tx.value),
      currency: CURRENCY,
      debit,
      credit,
      automated: 'TRUE',
    };
    if (record.amount != 0) {
      console.log(record);
      records.push(record);
    }
    const feeRecord = {
      date,
      event,
      userName,
      description: `tarifa ${description}`,
      amount: txFee,
      currency: CURRENCY,
      debit: 'gasto:tarifas:eth',
      credit: 'activo:owl',
      automated: 'TRUE',
    };
    if (!receiving) {
      console.log(feeRecord);
      records.push(feeRecord);
    }
  }

}

const main = async () => {
  await getRecords();
  db.disconnect();
}

main();
