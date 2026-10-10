'use strict';

// Юнит-тесты чистых функций import.js (сериализация/парсинг форм, без DOM). Запуск:
// node --test.

const test = require('node:test');
const assert = require('node:assert/strict');
const Import = require('../import.js');

// --- wrapSourceJs ------------------------------------------------------------

test('wrapSourceJs: строки -> columns, с undefined (не было значения) и null (явно пусто)', () => {
  const payload = {
    meta: { name: 'Excel1', key: 'id', labels: ['a', 'b'], rows: 2 },
    data: [
      { id: '1', a: 'x' },            // b отсутствует -- значения не было
      { id: '2', a: 'y', b: null }    // b явно null
    ]
  };
  const js = Import.wrapSourceJs('Excel1', payload);
  assert.match(js, /window\.DS\.sources\["Excel1"\] = \{/);
  assert.ok(js.includes('"id": function () { return ["1", "2"]; }'));
  assert.ok(js.includes('"a": function () { return ["x", "y"]; }'));
  assert.ok(js.includes('"b": function () { return [undefined, null]; }'));
});

test('wrapSourceJs: без ключа в meta -- columns строится только из labels', () => {
  const payload = { meta: { name: 'X', labels: ['a'], rows: 1 }, data: [{ a: '1' }] };
  const js = Import.wrapSourceJs('X', payload);
  assert.ok(js.includes('"a": function () { return ["1"]; }'));
  assert.ok(!js.includes('"undefined": function'));
});

// --- buildManifestFragmentJs / buildImportsIndexJs ---------------------------

test('buildManifestFragmentJs: один источник в sources', () => {
  const js = Import.buildManifestFragmentJs({ name: 'Excel1', file: 'Excel1.js', key: 'id' });
  assert.match(js, /window\.DS_MANIFEST_FRAGMENT = /);
  const sandbox = {};
  new Function('window', js)(sandbox);
  assert.deepEqual(sandbox.DS_MANIFEST_FRAGMENT.sources.map((s) => s.name), ['Excel1']);
});

test('buildImportsIndexJs + parsePriorImportsIndex -- круговой путь (round-trip)', () => {
  const js = Import.buildImportsIndexJs(['manifest-A.js', 'manifest-B.js']);
  assert.deepEqual(Import.parsePriorImportsIndex(js), ['manifest-A.js', 'manifest-B.js']);
});

// --- parsePriorImportsIndex: не падает на мусоре/отсутствии -----------------

test('parsePriorImportsIndex: пусто/null -> пустой список', () => {
  assert.deepEqual(Import.parsePriorImportsIndex(null), []);
  assert.deepEqual(Import.parsePriorImportsIndex(''), []);
});

test('parsePriorImportsIndex: битый/не тот файл -> пустой список, не исключение', () => {
  assert.deepEqual(Import.parsePriorImportsIndex('это не js вовсе {{{'), []);
  assert.deepEqual(Import.parsePriorImportsIndex('window.DS_MANIFEST = {};'), []);
});

// --- mergeImportsIndex --------------------------------------------------------

test('mergeImportsIndex: добавляет новое имя', () => {
  assert.deepEqual(Import.mergeImportsIndex(['manifest-A.js'], 'manifest-B.js'),
    ['manifest-A.js', 'manifest-B.js']);
});

test('mergeImportsIndex: повторный импорт того же источника -- не дублирует имя файла', () => {
  assert.deepEqual(Import.mergeImportsIndex(['manifest-A.js'], 'manifest-A.js'), ['manifest-A.js']);
});

test('mergeImportsIndex: пустой/отсутствующий prior -- список из одного имени', () => {
  assert.deepEqual(Import.mergeImportsIndex(null, 'manifest-A.js'), ['manifest-A.js']);
});

// --- tableFromSheetRows --------------------------------------------------------

test('tableFromSheetRows: первая строка -- заголовки, значения -- строки', () => {
  const aoa = [['id', 'name'], [1, 'Alice'], [2, 'Bob']];
  const t = Import.tableFromSheetRows(aoa);
  assert.deepEqual(t.headers, ['id', 'name']);
  assert.deepEqual(t.rows, [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]);
});

test('tableFromSheetRows: короткая строка -- недостающее поле отсутствует в объекте (не "")', () => {
  const aoa = [['id', 'name', 'phone'], [1, 'Alice']];
  const t = Import.tableFromSheetRows(aoa);
  assert.deepEqual(t.rows, [{ id: '1', name: 'Alice' }]);
  assert.ok(!('phone' in t.rows[0]));
});

test('tableFromSheetRows: пустая ячейка ("") -- тоже отсутствует, не пустая строка', () => {
  const aoa = [['id', 'name'], [1, '']];
  const t = Import.tableFromSheetRows(aoa);
  assert.deepEqual(t.rows, [{ id: '1' }]);
});

test('tableFromSheetRows: полностью пустая строка листа -- пропускается', () => {
  const aoa = [['id', 'name'], [], [1, 'Alice']];
  const t = Import.tableFromSheetRows(aoa);
  assert.equal(t.rows.length, 1);
});

test('tableFromSheetRows: пустой лист (нет заголовков) -- пустой headers', () => {
  const t = Import.tableFromSheetRows([]);
  assert.deepEqual(t.headers, []);
  assert.deepEqual(t.rows, []);
});
