const students = [
  {
    student_id: 'CCS-2026-9B-01',
    name: 'Rahul Sharma',
    class: '9',
    section: 'B',
  },
  {
    student_id: 'CCS-2026-9A-02',
    name: 'Aarav Sharma',
    class: '9',
    section: 'A',
  },
  {
    student_id: 'CCS-2026-10A-01',
    name: 'Ananya Verma',
    class: '10',
    section: 'A',
  },
  {
    student_id: 'CCS-2026-8A-02',
    name: 'Vihaan Gupta',
    class: '8',
    section: 'A',
  }
];

const HINDI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const HINDI_CLASS_WORDS = {
  'छह': '6', 'छः': '6', 'छठी': '6', 'सिक्स': '6',
  'सात': '7', 'सातवीं': '7', 'सेवन': '7',
  'आठ': '8', 'आठवीं': '8', 'एट': '8',
  'नौ': '9', 'नवी': '9', 'नवमी': '9', 'नौवीं': '9', 'नाइन': '9',
  'दस': '10', 'दसवीं': '10', 'टेन': '10',
  'ग्यारह': '11', 'ग्यारहवीं': '11', 'इलेवन': '11',
  'बारह': '12', 'बारहवीं': '12', 'ट्वेल्व': '12',
};

const SECTION_NORMALIZER = {
  'a': 'A', 'ay': 'A', 'ae': 'A', 'ए': 'A', 'अ': 'A',
  'b': 'B', 'bhi': 'B', 'भी': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bi': 'B', 'bhee': 'B',
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C',
};

const COMMON_HINDI_NAMES = {
  'राहुल': 'rahul', 'शर्मा': 'sharma',
  'अनन्या': 'ananya', 'वर्मा': 'verma',
  'विहान': 'vihaan', 'गुप्ता': 'gupta',
  'दिया': 'diya', 'पटेल': 'patel',
  'कबीर': 'kabir', 'सिंह': 'singh',
  'प्रिया': 'priya', 'मेहता': 'mehta',
  'आरव': 'aarav', 'रोहन': 'rohan',
  'ईशान': 'ishaan', 'आदित्य': 'aditya',
};

const DEVANAGARI_CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
};

const DEVANAGARI_VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': ''
};

function transliterateDevanagari(text) {
  const words = text.split(/\s+/);
  const transliteratedWords = words.map(w => {
    // Strip trailing punctuation from each word before dictionary lookup
    const cleanW = w.replace(/[।,!?;:\-_.'"]/g, '').trim();
    if (COMMON_HINDI_NAMES[cleanW]) {
      return COMMON_HINDI_NAMES[cleanW];
    }
    let res = '';
    for (let i = 0; i < cleanW.length; i++) {
      const ch = cleanW[i];
      if (DEVANAGARI_CONSONANTS[ch]) {
        res += DEVANAGARI_CONSONANTS[ch];
        const next = cleanW[i + 1];
        if (next && DEVANAGARI_VOWELS[next] !== undefined) {
          res += DEVANAGARI_VOWELS[next];
          i++;
        } else if (next !== '्') {
          res += 'a';
        }
      } else if (DEVANAGARI_VOWELS[ch] !== undefined) {
        res += DEVANAGARI_VOWELS[ch];
      } else {
        res += ch;
      }
    }
    return res;
  });

  return transliteratedWords.join(' ');
}

function parseVoiceInput(transcript) {
  let text = transcript.replace(/[।,!?;:\-_'"]/g, ' ').trim();
  text = text.replace(/[०-९]/g, ch => HINDI_DIGITS[ch] || ch);

  let studentClass;
  let section;

  // 1. Check Section keyword
  const secKeywordMatch = text.match(/(?:section|sec|सेक्शन|वर्ग|भाग)\s*[:\-]?\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)(?:\s|$|[^\w\u0900-\u097F])/i);
  if (secKeywordMatch) {
    const rawKey = secKeywordMatch[1].toLowerCase().trim();
    if (SECTION_NORMALIZER[rawKey]) {
      section = SECTION_NORMALIZER[rawKey];
    }
  }

  // 2. Check Class keyword
  const hindiClassWordMatch = text.match(/(?:कक्षा|क्लास|वर्ग)\s*([^\s,]+)/i);
  if (hindiClassWordMatch) {
    const word = hindiClassWordMatch[1];
    if (HINDI_CLASS_WORDS[word]) {
      studentClass = HINDI_CLASS_WORDS[word];
    } else if (/^\d+$/.test(word)) {
      studentClass = word;
    }
  }

  if (!studentClass) {
    const classMatch = text.match(/(?:class|grade|standard|kaksha|कक्षा|क्लास)\s*(\d{1,2})/i);
    if (classMatch) {
      studentClass = classMatch[1];
    }
  }

  // 3. Section following class or digit
  if (!section && studentClass) {
    const directFollowSecMatch = text.match(new RegExp(`(?:(?:class|grade|standard|कक्षा|क्लास)\\s*)?${studentClass}\\s*[-]?\\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)(?:\\s|$|[^\w\u0900-\\u097F])`, 'i'));
    if (directFollowSecMatch) {
      const raw = directFollowSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

  // 4. Trailing section
  if (!section) {
    const trailingSecMatch = text.match(/(?:^|\s)(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\s*$/i);
    if (trailingSecMatch) {
      const raw = trailingSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

  // 5. Fallback class
  if (!studentClass) {
    const isolatedNum = text.match(/\b(6|7|8|9|10|11|12)\b/);
    if (isolatedNum) {
      studentClass = isolatedNum[1];
    } else {
      for (const [w, num] of Object.entries(HINDI_CLASS_WORDS)) {
        if (text.includes(w)) {
          studentClass = num;
          break;
        }
      }
    }
  }

  // Clean text to isolate name
  let cleaned = text
    .replace(/(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)\s*\d+/gi, '')
    .replace(/(?:कक्षा|क्लास|वर्ग)\s*(?:छह|छः|सात|आठ|नौ|दस|ग्यारह|बारह|नौवीं|दसवीं)/g, '')
    .replace(/(?:कक्षा|क्लास|वर्ग)/g, '')
    .replace(/(?:section|sec|सेक्शन|वर्ग|भाग)/gi, '')
    .replace(/(?:^|\s)(?:bhi|भी|बी|bee|be|bi|bhee|ay|ae|see|sea|si)(?:\s|$)/gi, ' ')
    .replace(/(?:^|\s)[a-cA-Cए-सीबअ]\s*$/gi, ' ')
    .replace(/\b(6|7|8|9|10|11|12)\b/g, '')
    .replace(/\d+/g, '')
    .trim();

  let transliteratedName = cleaned;
  if (/[\u0900-\u097F]/.test(cleaned)) {
    transliteratedName = transliterateDevanagari(cleaned);
  }

  let name = transliteratedName
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { rawTranscript: transcript, name, studentClass, section };
}

function findStudentByVoice(query, students) {
  const normName = query.name.toLowerCase().trim();

  // 1. Direct exact or substring match
  const candidates = students.filter(s => {
    const sName = s.name.toLowerCase();
    const queryParts = normName.split(' ').filter(p => p.length >= 3);

    const matchesName =
      (normName.length >= 3 && (sName.includes(normName) || normName.includes(sName))) ||
      queryParts.every(part => sName.includes(part));

    if (!matchesName && normName.length >= 3) return false;

    if (query.studentClass && s.class !== query.studentClass) {
      return false;
    }
    if (query.section && s.section !== query.section) {
      return false;
    }
    return true;
  });

  if (candidates.length === 1) {
    return { student: candidates[0], confidence: 1.0, matches: candidates };
  }

  if (candidates.length > 1) {
    const exact = candidates.find(c => c.name.toLowerCase() === normName);
    if (exact) return { student: exact, confidence: 0.95, matches: candidates };

    if (query.section) {
      const secMatch = candidates.find(c => c.section === query.section);
      if (secMatch) return { student: secMatch, confidence: 0.9, matches: candidates };
    }
    return { student: candidates[0], confidence: 0.8, matches: candidates };
  }

  // Fallback: match by class and name parts
  if (query.studentClass && normName.length >= 3) {
    const classMatches = students.filter(s => s.class === query.studentClass && s.name.toLowerCase().includes(normName));
    if (classMatches.length > 0) {
      if (query.section) {
        const secMatch = classMatches.find(s => s.section === query.section);
        if (secMatch) return { student: secMatch, confidence: 0.9, matches: classMatches };
      }
      return { student: classMatches[0], confidence: 0.85, matches: classMatches };
    }
  }

  return { student: null, confidence: 0, matches: [] };
}

const testHindiInputs = [
  'राहुल शर्मा कक्षा 9 बी',
  'राहुल शर्मा कक्षा 9 भी',
  'राहुल शर्मा कक्षा 9 बी।',
  'राहुल शर्मा कक्षा 9',
  'राहुल शर्मा 9 बी',
  'राहुल शर्मा 9 भी',
  'राहुल शर्मा क्लास 9 बी',
  'राहुल शर्मा कक्षा नौवीं सेक्शन बी',
  'अनन्या वर्मा कक्षा 10 ए',
  'विहान गुप्ता कक्षा 8 ए'
];

testHindiInputs.forEach(inp => {
  const q = parseVoiceInput(inp);
  const res = findStudentByVoice(q, students);
  console.log(`"${inp}" => Name: "${q.name}", Class: "${q.studentClass}", Section: "${q.section}" => Match: ${res.student ? res.student.name + ' (' + res.student.class + '-' + res.student.section + ')' : 'NONE'}`);
});
