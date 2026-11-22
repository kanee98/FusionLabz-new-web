const crypto = require('crypto');
const config = require('./config');
const jsonAdapter = require('./db-json');
const mysqlAdapter = require('./db-mysql');

const active = config.USE_MYSQL ? mysqlAdapter : jsonAdapter;

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function slugify(str) {
  return (
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || uid('item')
  );
}

module.exports = {
  ...active,
  uid,
  slugify,
};
