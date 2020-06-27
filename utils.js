const web3Utils = require('web3-utils');
const util = require('ethereumjs-util');
const db = require('../owl/src/db.js');
const { deployAddress, owlAddress } = require('./settings.json');

const isReceiving = async address => {
  const checksumAddress = web3Utils.toChecksumAddress(address);
  return checksumAddress === owlAddress;
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

module.exports = { isReceiving, extractAddress, getUserName, getEvent };
