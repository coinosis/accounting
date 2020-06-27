const db = require('../owl/src/db.js');

const getUserName = async address => {
  const user = await db.users.findOne({ address });
  if (user === null) return '';
  return user.name;
}

module.exports = { getUserName };
