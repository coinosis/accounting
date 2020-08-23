const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const { getUserName } = require('./utils.js');

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
const STAGING = 'staging';
const SALE = 'Venta';
const TRANSFER = 'Transferencia bancaria';
const EMILIO = 'Emilio Silva';
const LIABILITY_EMILIO = 'pasivo:Emilio Silva';
const LIABILITY_JUAN = 'pasivo:Juan David'
const AUTHOR = 'macaw';
const accounts = {
  'Venta': 'ingreso:cambio',
  'Tarifa PayU': 'gasto:tarifas:payu',
  'Impuesto tarifa PayU': 'gasto:tarifas:payu',
  'Retenci?n de ICA': 'gasto:tarifas:payu',
  'Retenci?n de renta': 'gasto:tarifas:payu',
};
const descriptions = {
  'Venta': 'inscripción entrante',
  'Tarifa PayU': 'tarifa PayU',
  'Impuesto tarifa PayU': 'IVA tarifa PayU',
  'Retenci?n de ICA': 'reteICA tarifa PayU',
  'Retenci?n de renta': 'reteRenta tarifa PayU',
};
const creditors = {
  'Juan David': LIABILITY_JUAN,
  'JD Account 2 - 25may': LIABILITY_JUAN,
  'Emilio Silva': LIABILITY_EMILIO,
  '0xe1fF19182deb2058016Ae0627c1E4660A895196a': LIABILITY_EMILIO,
  '0x65ce6578ceA65E5779f0769901D2d4158bf37F53': LIABILITY_EMILIO,
  '0x1b888AeB1F7BBb66743D29dB2f3eAb127682F91D': LIABILITY_EMILIO,
  '0x0Ff3A89fe7FE22Da2FEA8Bb4DC0B1Ab614e48E0a': LIABILITY_EMILIO,
  '0x5539e97E0053d26bcF663DDCa7108dF87955a802': LIABILITY_JUAN,
  '0xb1B8D06A45651DE7f05CeddC2D009d14Fa251e06': LIABILITY_JUAN,
  '0x2127981268A29274AcE00893041F7e9a0F78b400': LIABILITY_JUAN,
  '0xCA2438D82c05580eC26e926c81F00BBa2Ef69f1d': LIABILITY_JUAN,
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
      headers.push({
        date: datum[keys.date],
        event: '',
        userName: EMILIO,
        description: TRANSFER,
        amount: datum[keys.debitAmount],
        currency: CURRENCY,
        debit: LIABILITY_EMILIO,
        credit: ASSET,
        author: AUTHOR,
      });
      settings.push({ category });
    }
    else if (category === SALE) {
      const reference = datum[keys.reference];
      const referenceGroups = reference.split(':');
      const event = referenceGroups[0];
      const userAddress = referenceGroups[1];
      const userName = await getUserName(userAddress);
      const header = {
        date: datum[keys.date],
        event,
        userName: userName || userAddress,
        description: '',
        amount: '',
        currency: CURRENCY,
        debit: '',
        credit: '',
        author: AUTHOR,
      };
      headers.push(header);
      const environment = referenceGroups[3];
      settings.push({ category, userName, userAddress, environment });
    }
    const header = headers[headers.length - 1];
    const setting = settings[settings.length - 1];
    if (setting.category === TRANSFER) {
      if (category === TRANSFER) {
        records.push(header);
      }
      continue;
    }
    const credit = setting.environment === STAGING
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
      creditRecord.description = descriptions[datum[keys.credit]];
      records.push(creditRecord);
    }
    if (!badValues.includes(datum[keys.debit])) {
      const debitRecord = {
        ...header,
        amount: datum[keys.debitAmount],
        debit: accounts[datum[keys.debit]],
        credit: ASSET,
      };
      debitRecord.description = descriptions[datum[keys.debit]];
      records.push(debitRecord);
    }
  }
  return records;
}

module.exports = { getRecords };
