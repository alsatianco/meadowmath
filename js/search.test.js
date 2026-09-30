// js/search.test.js — run with: node --test js/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const MeadowSearch = require('./search.js');
const index = require('../data/search-index.json');

const engine = MeadowSearch.create(index);
const titles = (list, n = 5) => list.slice(0, n).map(r => r.doc.en.title);
const top = query => engine.search(query).results[0];

test('normalize removes accents, including Vietnamese đ', () => {
  assert.strictEqual(MeadowSearch.normalize('Đếm Số!'), 'dem so');
  assert.strictEqual(MeadowSearch.normalize("O'clock"), 'oclock');
});

test('stemmer handles plurals and -ing without over-stemming', () => {
  assert.strictEqual(MeadowSearch.stem('fractions'), 'fraction');
  assert.strictEqual(MeadowSearch.stem('pennies'), 'penny');
  assert.strictEqual(MeadowSearch.stem('boxes'), 'box');
  assert.strictEqual(MeadowSearch.stem('counting'), 'count');
  assert.strictEqual(MeadowSearch.stem('skipping'), 'skip');
  assert.strictEqual(MeadowSearch.stem('times'), 'times');
  assert.strictEqual(MeadowSearch.stem('class'), 'class');
});

test('processTerm drops stop words and indexes accented words twice', () => {
  assert.strictEqual(MeadowSearch.processTerm('the'), null);
  assert.strictEqual(MeadowSearch.processTerm('Shapes'), 'shape');
  assert.deepStrictEqual(MeadowSearch.processTerm('Tiền'), ['tiền', 'tien']);
});

test('parseQuery detects grades, ages and sections', () => {
  const cases = {
    'grade 3 fractions': 'grade3',
    '2nd grade money': 'grade2',
    'first grade': 'grade1',
    'lớp 5 phân số': 'grade5',
    'kindergarten shapes': 'kinder',
    'pre-k counting': 'prek',
    '4 year old counting': 'prek',
    'age 7 adding': 'grade2',
    'number friends': 'number-friends',
    'clock tool': 'tools',
    'count to 10': null
  };
  for (const [query, section] of Object.entries(cases)) {
    assert.strictEqual(MeadowSearch.parseQuery(query).section, section, query);
  }
});

test('parseQuery removes grade words and maps phrases to concepts', () => {
  assert.deepStrictEqual(MeadowSearch.parseQuery('grade 3 fractions').groups.map(g => g.term), ['fraction']);
  assert.deepStrictEqual(MeadowSearch.parseQuery('times tables').groups.map(g => g.term), ['multiplication']);
  assert.deepStrictEqual(MeadowSearch.parseQuery('bảng cửu chương').groups.map(g => g.term), ['multiplication']);
  assert.deepStrictEqual(MeadowSearch.parseQuery('how can my kid learn to add').groups.map(g => g.term), ['add']);
});

test('every index document has a URL, section and English title', () => {
  const sectionIds = new Set(index.sections.map(s => s.id));
  for (const doc of index.docs) {
    assert.ok(doc.url && doc.en && doc.en.title, doc.id);
    assert.ok(sectionIds.has(doc.section), doc.id);
  }
});

test('title matches rank first', () => {
  assert.strictEqual(top('count the coins').doc.en.title, 'Count the Coins');
  assert.strictEqual(top('geoboard').doc.en.title, 'Geoboard');
});

test('everyday words find the right math topic', () => {
  assert.match(top('plus').doc.en.title, /add/i);
  assert.match(top('take away').doc.en.title, /take|subtract/i);
  assert.match(top('times tables').doc.en.title, /multipl/i);
  assert.ok(titles(engine.search('telling time').results).some(t => /time/i.test(t)));
  assert.strictEqual(top('money').doc.en.title, 'Count the Coins');
});

test('typos are tolerated', () => {
  assert.match(top('fracton').doc.en.title, /fraction/i);
  assert.match(top('multipication').doc.en.title, /multipl/i);
});

test('correctly spelled words are not fuzzy-matched to other words', () => {
  // "shape" must not match "share"/"sharing" activities.
  const results = engine.search('shape').results;
  assert.ok(results.every(r => r.terms.every(term => term !== 'share')));
});

test('grade in the query filters results to that grade', () => {
  const response = engine.search('grade 3 fractions');
  assert.strictEqual(response.section, 'grade3');
  assert.ok(response.results.length > 0);
  assert.ok(response.results.every(r => r.doc.section === 'grade3'));
});

test('section "all" disables grade detection', () => {
  const response = engine.search('grade 3 fractions', { section: 'all' });
  assert.strictEqual(response.section, null);
  assert.ok(response.results.some(r => r.doc.section !== 'grade3'));
});

test('explicit grade filter is applied', () => {
  const response = engine.search('shapes', { section: 'kinder' });
  assert.ok(response.results.length > 0);
  assert.ok(response.results.every(r => r.doc.section === 'kinder'));
});

test('a grade-only query lists that grade, landing page first', () => {
  const response = engine.search('grade 2');
  assert.strictEqual(response.results[0].doc.type, 'grade');
  assert.ok(response.results.every(r => r.doc.section === 'grade2'));
  assert.ok(response.results.length > 10);
});

test('Vietnamese works with and without accents', () => {
  assert.strictEqual(top('tiền').doc.en.title, 'Count the Coins');
  assert.match(top('dem').doc.en.title, /count/i);
  assert.match(top('phân số').doc.en.title, /fraction/i);
});

test('accented Vietnamese is precise ("tiền" money is not "tiên" first)', () => {
  const ids = engine.search('tiền').results.map(r => r.doc.id);
  assert.ok(!ids.some(id => /first-estimate/.test(id)), ids.join(', '));
});

test('activities matching only via their level go to related results', () => {
  const response = engine.search('money');
  assert.ok(response.related.length > 0);
  assert.ok(response.results.every(r => r.own));
});

test('nonsense returns no results', () => {
  const response = engine.search('xyzzyqq');
  assert.strictEqual(response.results.length, 0);
  assert.strictEqual(response.related.length, 0);
});

test('empty query returns nothing to show', () => {
  const response = engine.search('   ');
  assert.strictEqual(response.results.length, 0);
});
