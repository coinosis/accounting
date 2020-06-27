const fetch = require('node-fetch');
const web3Utils = require('web3-utils');
const { owlAddress, etherscanKey } = require('./settings.json');
const { getEvent } = require('./utils.js');
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
    const checksumTo = web3Utils.toChecksumAddress(tx.to);
    const event = await getEvent(checksumTo);
    const record = {
      date: new Date(Number(tx.timeStamp) * 1000),
      event,
      userName: '',
      description: 'inscripción',
      amount: web3Utils.fromWei(tx.value),
      currency: CURRENCY,
      debit: 'gasto:cambio:eth',
      credit: 'activo:owl',
      automated: 'TRUE',
    };
    console.log(record);
    records.push(record);
  }
  db.disconnect();
}

getRecords();
