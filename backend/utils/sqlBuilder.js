const format = require('pg-format');

const ALLOWED_TYPES = new Set(['serial','integer','bigint','text','varchar','boolean','date','timestamp','numeric','jsonb']);

function normalizeType(t) {
  if (!t) return 'text';
  t = t.toLowerCase();
  if (t === 'string') return 'text';
  if (t === 'int' || t === 'number') return 'integer';
  if (t.startsWith('varchar')) {
    if (/^varchar\(\d+\)$/.test(t)) return t;
    return 'text';
  }
  if (ALLOWED_TYPES.has(t)) return t;
  return 'text';
}

function isAllowedType(t) {
  if (ALLOWED_TYPES.has(t)) return true;
  return /^varchar\(\d+\)$/.test(t);
}

async function createSchemaAndTables(pool, schemaName, schemaDef) {
  // create schema
  await pool.query(format('CREATE SCHEMA IF NOT EXISTS %I', schemaName));

  // create each table
  for (const table of (schemaDef.tables || [])) {
    const colsSql = table.columns.map(col => {
      const colName = col.name;
      const rawType = normalizeType(col.type);
      if (!isAllowedType(rawType) && rawType !== 'text') {
        throw new Error('Unsupported column type: ' + rawType);
      }
      let parts = [format('%I', colName), rawType];
      if (col.pk) parts.push('PRIMARY KEY');
      if (col.notNull || (col.nullable === false)) parts.push('NOT NULL');
      if (col.unique) parts.push('UNIQUE');
      if (col.default !== undefined) {
        // basic escaping for string defaults
        const def = typeof col.default === 'string'
          ? `'${col.default.replace(/'/g, "''")}'`
          : col.default;
        parts.push('DEFAULT ' + def);
      }
      return parts.join(' ');
    }).join(', ');

    const createSql = format('CREATE TABLE IF NOT EXISTS %I.%I (%s)', schemaName, table.name, colsSql);
    await pool.query(createSql);
  }
}

module.exports = { createSchemaAndTables, normalizeType };
