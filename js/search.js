/* Site Search Engine - Meadow Math
 *
 * Wraps MiniSearch (BM25+ ranking, prefix + typo-tolerant matching) with
 * tweaks for our audience (parents, teachers, kids — mostly non-technical):
 *   - accent-insensitive matching ("dem" finds "đếm"), simple English stemming
 *   - everyday-language synonyms ("plus" -> addition, "take away" -> subtraction)
 *   - grade / age detection ("grade 2 money", "4 year old counting")
 *   - "all words" matches first, then "some words" matches as related results
 *
 * Works in the browser (window.MeadowSearch) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/minisearch.min.js'));
  } else {
    root.MeadowSearch = factory(root.MiniSearch);
  }
})(typeof self !== 'undefined' ? self : this, function (MiniSearch) {
  'use strict';

  const LANGS = ['en', 'vi'];

  // Words that carry no meaning for finding an activity (already accent-free).
  const STOP_WORDS = new Set([
    // English
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'at', 'by', 'with', 'from',
    'is', 'are', 'be', 'it', 'its', 'this', 'that', 'my', 'our', 'your', 'me', 'i', 'we', 'you',
    'how', 'what', 'which', 'where', 'who', 'do', 'does', 'can', 'want', 'need', 'help', 'find',
    'show', 'some', 'about', 'please', 'kid', 'kids', 'child', 'children', 'son', 'daughter',
    'student', 'students', 'game', 'games', 'activity', 'activities', 'practice', 'practise',
    'learn', 'learning', 'play', 'playing', 'fun', 'easy', 'math', 'maths', 'old', 'year', 'years',
    // Vietnamese (accents removed)
    'va', 'cho', 'cua', 'voi', 'la', 'cac', 'nhung', 'be', 'con', 'em', 'tre', 'hoc', 'sinh',
    'tro', 'choi', 'bai', 'tap', 'toan', 'luyen', 'giup', 'tim', 'muon', 'nao', 'gi'
  ]);

  // Words the stemmer must leave alone ("times" is multiplication, not "time").
  const STEM_EXCEPTIONS = new Set(['times', 'is', 'has', 'was', 'this', 'less', 'plus', 'minus', 'bus', 'us']);

  // Each group is a set of interchangeable everyday words (unstemmed). Vietnamese words keep
  // their accents so they only match that exact word ("tiền" money, not "tiên" first).
  const SYNONYM_GROUPS = [
    ['add', 'addition', 'plus', 'sum', 'total', 'altogether', 'cộng', 'tổng'],
    ['subtract', 'subtraction', 'minus', 'difference', 'takeaway', 'trừ'],
    ['multiply', 'multiplication', 'times', 'product', 'array', 'nhân'],
    ['divide', 'division', 'share', 'quotient', 'chia'],
    ['fraction', 'half', 'halves', 'quarter', 'third', 'numerator', 'denominator'],
    ['time', 'clock', 'hour', 'minute', 'oclock', 'giờ'],
    ['money', 'coin', 'dollar', 'cent', 'penny', 'nickel', 'dime', 'tiền'],
    ['shape', 'geometry', 'triangle', 'circle', 'square', 'rectangle', 'hình'],
    ['measure', 'measurement', 'length', 'ruler', 'long', 'tall', 'height', 'inch'],
    ['weight', 'heavy', 'heavier', 'light', 'lighter'],
    ['count', 'counting', 'đếm'],
    ['compare', 'greater', 'bigger', 'larger', 'smaller', 'fewer', 'more', 'less'],
    ['pattern', 'sequence', 'repeat'],
    ['graph', 'chart', 'data', 'tally', 'pictograph'],
    ['decimal', 'tenth', 'hundredth'],
    ['area', 'perimeter'],
    ['round', 'rounding', 'estimate', 'estimation'],
    ['bond', 'partner', 'split', 'decompose']
  ];

  // Multi-word phrases (matched accent-free). `replace` swaps the phrase for one concept
  // word; otherwise the concept is added as an optional extra keyword.
  const PHRASES = [
    { pattern: /\btake(?:s|n)? away\b/g, keyword: 'subtract' },
    { pattern: /\btimes? tables?\b/g, keyword: 'multiplication', replace: true },
    { pattern: /\bbang cuu chuong\b/g, keyword: 'multiplication', replace: true },
    { pattern: /\bphep nhan\b/g, keyword: 'multiplication', replace: true },
    { pattern: /\bphep chia\b/g, keyword: 'division', replace: true },
    { pattern: /\bphep cong\b/g, keyword: 'addition', replace: true },
    { pattern: /\bphep tru\b/g, keyword: 'subtraction', replace: true },
    { pattern: /\bso thap phan\b/g, keyword: 'decimal', replace: true },
    { pattern: /\bphan so\b/g, keyword: 'fraction', replace: true },
    { pattern: /\b(?:dong ho|xem gio)\b/g, keyword: 'clock', replace: true },
    { pattern: /\bhinh hoc\b/g, keyword: 'geometry', replace: true },
    { pattern: /\bso sanh\b/g, keyword: 'compare', replace: true },
    { pattern: /\bo ?clock\b/g, keyword: 'clock', replace: true }
  ];

  const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };

  // Grade / section detection. Order matters: more specific patterns first.
  const SECTION_PATTERNS = [
    [/\b(number friends?|ban so)\b/g, () => 'number-friends'],
    [/\b(pre ?k|pre ?kindergarten|pre ?school|preschool|nursery|toddlers?|mam non|nha tre)\b/g, () => 'prek'],
    [/\b(kindergarten|kinder|kindy|mau giao|lop la|grade k|k)\b/g, () => 'kinder'],
    [/\b(?:grade|gr|lop|class|year)\s*([1-5]|one|two|three|four|five)\b/g, m => gradeId(m[1])],
    [/\b([1-5])(?:st|nd|rd|th)?\s*grade(?:rs?)?\b/g, m => gradeId(m[1])],
    [/\b(first|second|third|fourth|fifth)\s*grade(?:rs?)?\b/g, m => gradeId(m[1])],
    [/\bg([1-5])\b/g, m => gradeId(m[1])],
    [/\b(?:age|aged|tuoi)\s*(\d{1,2})\b/g, m => ageToSection(+m[1])],
    [/\b(\d{1,2})\s*(?:years?|yrs?|yo|y o|tuoi)(?:\s*olds?)?\b/g, m => ageToSection(+m[1])],
    [/\b(tools?|manipulatives?|cong cu)\b/g, () => 'tools']
  ];

  function gradeId(value) {
    const n = WORD_NUMBERS[value] || parseInt(value, 10);
    return n >= 1 && n <= 5 ? `grade${n}` : null;
  }

  // US grade ages: K = 5-6, Grade 1 = 6-7, ... Grade 5 = 10-11.
  function ageToSection(age) {
    if (age >= 2 && age <= 4) return 'prek';
    if (age === 5) return 'kinder';
    if (age >= 6 && age <= 10) return `grade${age - 5}`;
    if (age === 11) return 'grade5';
    return null;
  }

  /** Lowercase, remove accents (Vietnamese đ too), turn punctuation into spaces. */
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/['’]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  /** Very small English stemmer: plurals and -ing. Idempotent for our vocabulary. */
  function stem(word) {
    if (word.length <= 3 || STEM_EXCEPTIONS.has(word) || /\d/.test(word)) return word;
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (/(ss|us|is)$/.test(word)) return word;
    if (/(sh|ch|x|z)es$/.test(word)) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    if (word.endsWith('ing') && word.length >= 6) {
      let base = word.slice(0, -3);
      if (base.length >= 4 && /([b-df-hj-np-tv-z])\1$/.test(base) && !/(ll|ss|zz)$/.test(base)) {
        base = base.slice(0, -1);
      }
      return base;
    }
    return word;
  }

  function lowerNfc(text) {
    return String(text || '').toLowerCase().normalize('NFC');
  }

  /**
   * Index-time term pipeline. Accented words are indexed twice — as written
   * ("tiền") and accent-free ("tien") — so accent-free queries still match while
   * accented queries stay precise ("tiền" money ≠ "tiến" forward).
   */
  function processTerm(term) {
    const plain = normalize(term);
    if (!plain || plain.includes(' ') || STOP_WORDS.has(plain)) return null;
    const accented = lowerNfc(term);
    return accented === plain ? stem(plain) : [accented, plain];
  }

  /** Query-time: keep accents only if the user typed them. */
  function processQueryWord(word) {
    const plain = normalize(word);
    if (!plain || plain.includes(' ') || STOP_WORDS.has(plain)) return null;
    const accented = lowerNfc(word).replace(/['’]/g, '');
    const key = stem(plain);
    return { term: accented === plain ? key : accented, key };
  }

  // Map accent-free stem -> index terms of the other words in its group.
  const SYNONYMS = new Map();
  SYNONYM_GROUPS.forEach(group => {
    const words = group.map(w => processQueryWord(w)).filter(Boolean);
    words.forEach(({ key }) => {
      const set = SYNONYMS.get(key) || new Set();
      words.forEach(o => { if (o.key !== key) set.add(o.term); });
      SYNONYMS.set(key, set);
    });
  });

  /**
   * Parse a raw query into section filter + term groups.
   * @returns {{ section: string|null, groups: Array<{term: string, synonyms: string[]}> }}
   */
  function parseQuery(raw) {
    // Words are kept with accents (lowercased); patterns are matched on the accent-free copy.
    let words = lowerNfc(raw).replace(/['’]/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    let section = null;
    const extras = [];

    // Replace a pattern match (on accent-free words) with `replacement` words.
    const consume = (pattern, onMatch) => {
      let plain = words.map(normalize);
      let text = ` ${plain.join(' ')} `;
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text))) {
        const replacement = onMatch(match);
        if (replacement === undefined) continue;
        const start = text.slice(0, match.index).trim().split(' ').filter(Boolean).length;
        const count = match[0].trim().split(' ').length;
        words.splice(start, count, ...replacement);
        plain = words.map(normalize);
        text = ` ${plain.join(' ')} `;
        pattern.lastIndex = 0;
      }
    };

    for (const [pattern, toSection] of SECTION_PATTERNS) {
      consume(pattern, match => {
        const found = toSection(match);
        if (!found) return undefined;
        if (!section) section = found;
        return [];
      });
    }
    for (const phrase of PHRASES) {
      consume(phrase.pattern, () => {
        if (phrase.replace) return [phrase.keyword];
        extras.push(phrase.keyword);
        return undefined;
      });
    }

    const seen = new Set();
    const groups = [];
    const push = (processed, optional) => {
      if (!processed || seen.has(processed.term)) return;
      // Single letters alone are noise ("k", "a"), but keep numbers like "5".
      if (processed.key.length < 2 && !/\d/.test(processed.key)) return;
      seen.add(processed.term);
      const synonyms = [...(SYNONYMS.get(processed.key) || [])]
        .filter(s => s !== processed.term && s !== processed.key);
      groups.push({ term: processed.term, synonyms, optional });
    };

    words.forEach(word => push(processQueryWord(word), false));
    extras.forEach(keyword => push(processQueryWord(keyword), true));

    return { section, groups };
  }

  function docText(doc, key) {
    return LANGS.map(lang => {
      const value = doc[lang] && doc[lang][key];
      return Array.isArray(value) ? value.join(' ') : (value || '');
    }).join(' ');
  }

  // Typo tolerance: 1 edit for 4-7 letters, 2 edits for longer words.
  function fuzzyDistance(term) {
    return /\d/.test(term) ? 0 : term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0;
  }

  // Fields that describe the activity itself (vs. its level's topic/goal/skills).
  const OWN_FIELDS = new Set(['title', 'description', 'keywords']);

  function allowPrefix(term) {
    return term.length >= 3 && !/^\d+$/.test(term);
  }

  class Engine {
    constructor(indexData) {
      this.sections = indexData.sections || [];
      this.sectionOrder = new Map(this.sections.map(s => [s.id, s.order]));
      this.docs = new Map(indexData.docs.map(d => [d.id, d]));

      this.mini = new MiniSearch({
        fields: ['title', 'keywords', 'description', 'topic', 'skills', 'goal'],
        storeFields: [],
        extractField: (doc, field) => (field === 'id' ? doc.id : docText(doc, field)),
        processTerm,
        searchOptions: {
          boost: { title: 4, keywords: 2, description: 2, topic: 1.5, skills: 1, goal: 0.8 },
          fuzzy: fuzzyDistance,
          prefix: allowPrefix,
          weights: { fuzzy: 0.4, prefix: 0.6 },
          processTerm: term => term
        }
      });
      this.mini.addAll(indexData.docs);

      // Sorted vocabulary: words that exist (or are a prefix of one) are not typo-corrected.
      const vocab = new Set();
      indexData.docs.forEach(doc => ['title', 'keywords', 'description', 'topic', 'skills', 'goal']
        .forEach(field => docText(doc, field).split(/[^\p{L}\p{N}]+/u).forEach(word => {
          const t = word && processTerm(word);
          (Array.isArray(t) ? t : [t]).forEach(v => v && vocab.add(v));
        })));
      this.vocab = [...vocab].sort();
    }

    isKnownPrefix(term) {
      let lo = 0;
      let hi = this.vocab.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.vocab[mid] < term) lo = mid + 1; else hi = mid;
      }
      return lo < this.vocab.length && this.vocab[lo].startsWith(term);
    }

    getSection(id) {
      return this.sections.find(s => s.id === id) || null;
    }

    /** All documents of a section in site order (grade landing page first). */
    browse(section) {
      return [...this.docs.values()]
        .filter(d => d.section === section)
        .sort((a, b) => (a.type === 'grade' ? -1 : b.type === 'grade' ? 1 : 0))
        .map(doc => ({ doc, score: 0, terms: [] }));
    }

    /**
     * @param {string} query - what the user typed
     * @param {{ section?: string|null }} options - section: explicit filter; 'all' disables
     *   automatic grade detection; undefined uses the grade detected in the query.
     */
    search(query, options = {}) {
      const parsed = parseQuery(query);
      const section = options.section === 'all' ? null : (options.section || parsed.section);
      const filter = section ? (r => this.docs.get(r.id).section === section) : undefined;

      if (!parsed.groups.length) {
        return {
          section, detectedSection: parsed.section, terms: [],
          results: section ? this.browse(section) : [], related: []
        };
      }

      // Words the user typed count fully and get prefix/typo matching; synonyms and
      // implied phrase keywords must match exactly and count less.
      const typed = new Set(parsed.groups.filter(g => !g.optional).map(g => g.term));
      const isExtra = term => !typed.has(term);
      const groupQuery = g => ({ combineWith: 'OR', queries: [g.term, ...g.synonyms] });
      const required = parsed.groups.filter(g => !g.optional);
      const baseOptions = {
        filter,
        boostTerm: term => (isExtra(term) ? 0.35 : 1),
        prefix: term => !isExtra(term) && allowPrefix(term),
        fuzzy: term => (isExtra(term) || this.isKnownPrefix(term) ? 0 : fuzzyDistance(term))
      };

      const toResult = r => ({
        doc: this.docs.get(r.id),
        score: r.score,
        terms: r.terms,
        own: Object.values(r.match).some(fields => fields.some(f => OWN_FIELDS.has(f)))
      });
      const rank = (a, b) => b.score - a.score ||
        (this.sectionOrder.get(a.doc.section) - this.sectionOrder.get(b.doc.section));

      const strict = required.length
        ? this.mini.search({ combineWith: 'AND', queries: required.map(groupQuery) }, baseOptions)
          .map(toResult)
        : [];
      const strictIds = new Set(strict.map(r => r.doc.id));
      const loose = this.mini.search(
        { combineWith: 'OR', queries: parsed.groups.map(groupQuery) }, baseOptions
      ).map(toResult).filter(r => !strictIds.has(r.doc.id));

      // Best: every word matches, and the activity itself (not just its level) is about it.
      let results = strict.filter(r => r.own);
      let related = strict.filter(r => !r.own).concat(loose);
      if (!results.length) {
        results = strict.length ? strict : loose;
        related = strict.length ? loose : [];
      }
      return {
        section,
        detectedSection: parsed.section,
        terms: parsed.groups.map(g => g.term),
        results: results.sort(rank),
        related: related.sort(rank)
      };
    }
  }

  return {
    create: indexData => new Engine(indexData),
    normalize,
    processTerm,
    processQueryWord,
    parseQuery,
    stem
  };
});
