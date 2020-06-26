if (process.argv.length < 3) {
  console.log(`usage: node ./payu.js <file-path>`);
  process.exit();
}
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const db = require('../owl/src/db.js');

const getUserName = async address => {
  const user = await db.users.findOne({ address });
  if (user === null) return '';
  return user.name;
}

const keys = {
  category: 'Grupo de operaci?n',
  reference: 'Referencia',
  date: 'Fecha de creaci?n',
  credit: 'Cr?dito',
  creditAmount: 'Valor cr?dito',
  debit: 'D?bito',
  debitAmount: 'Valor d?bito',
};
const badValues = [
  '',
  'TOTAL',
]
const ASSET = 'activo:payu';
const CURRENCY = 'COP';
const TESTING = 'testing';
const TRANSFER = 'Transferencia bancaria';
const TRANSFER_EMILIO = 'transferencia Emilio';
const LIABILITY_EMILIO = 'pasivo:emilio';
const accounts = {
  'Venta': 'ingreso:inscripciones',
  'Tarifa PayU': 'gasto:tarifas:payu',
  'Impuesto tarifa PayU': 'gasto:tarifas:payu',
  'Retenci?n de ICA': 'gasto:tarifas:payu',
  'Retenci?n de renta': 'gasto:tarifas:payu',
};
const descriptions = {
  'Venta': 'inscripción',
  'Tarifa PayU': 'tarifa PayU',
  'Impuesto tarifa PayU': 'IVA tarifa PayU',
  'Retenci?n de ICA': 'reteICA tarifa PayU',
  'Retenci?n de renta': 'reteRenta tarifa PayU',
};
const creditors = {
  'Juan David': 'pasivo:juan',
  'JD Account 2 - 25may': 'pasivo:juan',
  'Emilio Silva': 'pasivo:emilio',
  '0xe1fF19182deb2058016Ae0627c1E4660A895196a': 'pasivo:emilio',
  '0x65ce6578ceA65E5779f0769901D2d4158bf37F53': 'pasivo:emilio',
  '0x1b888AeB1F7BBb66743D29dB2f3eAb127682F91D': 'pasivo:emilio',
  '0x5539e97E0053d26bcF663DDCa7108dF87955a802': 'pasivo:juan',
  '0xb1B8D06A45651DE7f05CeddC2D009d14Fa251e06': 'pasivo:juan',
};

const getRecords = async path => {
  const stream = fs.readFileSync(path, {encoding: 'utf8'});
  const data = parse(stream, { delimiter: ';', columns: true });

  const records = [];
  const headers = [];
  const settings = [];
  for (const datum of data) {
    const category = datum[keys.category];
    if (category === TRANSFER) {
      records.push({
        date: datum[keys.date],
        description: TRANSFER_EMILIO,
        CURRENCY,
        amount: datum[keys.debitAmount],
        debit: LIABILITY_EMILIO,
        credit: ASSET,
      });
      continue;
    }
    if (
      records.length
        && records[records.length - 1].description === TRANSFER_EMILIO
    ) continue;
    if (category) {
      const reference = datum[keys.reference];
      const referenceGroups = reference.split(':');
      const event = referenceGroups[0];
      const userAddress = referenceGroups[1];
      const userName = await getUserName(userAddress);
      const header = {
        date: datum[keys.date],
        description: `${event} - ${userName}`,
        CURRENCY,
      };
      headers.push(header);
      const environment = referenceGroups[3];
      settings.push({ userName, userAddress, environment });
    }
    const header = headers[headers.length - 1];
    const setting = settings[settings.length - 1];
    const credit = setting.environment === TESTING
          ? creditors[setting.userName]
          ? creditors[setting.userName]
          : creditors[setting.userAddress]
          : accounts[datum[keys.credit]];
    if (!badValues.includes(datum[keys.credit])) {
      const creditRecord = {
        ...header,
        amount: datum[keys.creditAmount],
        debit: ASSET,
        credit,
      };
      creditRecord.description += ` - ${descriptions[datum[keys.credit]]}`;
      records.push(creditRecord);
    }
    if (!badValues.includes(datum[keys.debit])) {
      const debitRecord = {
        ...header,
        amount: datum[keys.debitAmount],
        debit: accounts[datum[keys.debit]],
        credit: ASSET,
      };
      debitRecord.description += ` - ${descriptions[datum[keys.debit]]}`;
      records.push(debitRecord);
    }
  }
  db.disconnect();
  records.reverse();
  return records;
}

const exportRecords = async path => {
  const records = await getRecords(path);
  console.log(stringify(records));
}

exportRecords(process.argv[2]);
