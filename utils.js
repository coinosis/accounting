const web3Utils = require('web3-utils');
const util = require('ethereumjs-util');
const dbModule = require('./db.js');
const { deployAddress, owlAddress } = require('./settings.json');

let db;

const initialize = async () => {
  db = dbModule.getCollections();
}

const isReceiving = async address => {
  const checksumAddress = web3Utils.toChecksumAddress(address);
  return checksumAddress === owlAddress;
}

const isClapping = data => {
  const bufferData = util.toBuffer(data);
  return bufferData.length > 36;
}

// taken from https://stackoverflow.com/a/51643788/2430274
const formatDate = timestamp => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60;
  const localTimestamp = timestamp - offset;
  const date = new Date(localTimestamp * 1000);
  const iso = date.toISOString();
  const isoish = iso.replace('T', ' ').slice(0, 19);
  return isoish;
}

const extractAddress = data => {
  const bufferData = util.toBuffer(data);
  const bufferAddress = bufferData.subarray(16, 36);
  const address = util.bufferToHex(bufferAddress);
  return address;
}

const getUserName = async address => {
  const checksumAddress = web3Utils.toChecksumAddress(address);
  if (checksumAddress === deployAddress) {
    return 'deploy';
  }
  const user = await db.users.findOne({ address: checksumAddress });
  if (user === null) return '';
  return user.name;
}

const getEvent = async address => {
  const checksumAddress = web3Utils.toChecksumAddress(address);
  const event = await db.events.findOne({ address: checksumAddress });
  if (event === null) return '';
  return event.url;
}

module.exports = {
  initialize,
  isReceiving,
  isClapping,
  formatDate,
  extractAddress,
  getUserName,
  getEvent,
};
