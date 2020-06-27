const db = require('../owl/src/db.js');

const getUserName = async address => {
  const user = await db.users.findOne({ address });
  if (user === null) return '';
  return user.name;
}

const getEvent = async address => {
  const event = await db.events.findOne({ address });
  if (event === null) return '';
  return event.url;
}

module.exports = { getUserName, getEvent };
