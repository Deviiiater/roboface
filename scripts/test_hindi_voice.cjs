// Test Hindi voice matching directly
const fs = require('fs');

// We'll read studentsData.ts to see actual student records
const students = [
  {
    student_id: 'CCS-2026-9B-01',
    name: 'Rahul Sharma',
    class: '9',
    section: 'B',
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

// Let's test the regex and logic in voiceParser.ts
const HINDI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const HINDI_CLASS_WORDS = {
  'छह': '6', 'छः': '6', 'छठी': '6', 'सिक्स': '6',
  'सात': '7', 'सातवीं': '7', 'सेवन': '7',
  'आठ': '8', 'आठवीं': '8', 'एट': '8',
  'नौ': '9', 'नवी': '9', 'नवमी': '9', 'नाइन': '9',
  'दस': '10', 'दसवीं': '10', 'टेन': '10',
  'ग्यारह': '11', 'ग्यारहवीं': '11', 'इलेवन': '11',
  'बारह': '12', 'बारहवीं': '12', 'ट्वेल्व': '12',
};

const SECTION_NORMALIZER = {
  'a': 'A', 'ay': 'A', 'ae': 'A', 'ए': 'A', 'अ': 'A', 'apple': 'A',
  'b': 'B', 'bhi': 'B', 'भी': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bi': 'B', 'bhee': 'B', 'ball': 'B', 'boy': 'B',
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C', 'cat': 'C',
};

const COMMON_HINDI_NAMES = {
  'राहुल': 'rahul', 'शर्मा': 'sharma',
  'अनन्या': 'ananya', 'वर्मा': 'verma',
  'विहान': 'vihaan', 'गुप्ता': 'gupta',
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
    const cleanW = w.trim();
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

// Current implementation in voiceParser.ts
function parseVoiceInput(transcript) {
  let text = transcript.trim();
  text = text.replace(/[०-९]/g, ch => HINDI_DIGITS[ch] || ch);
  text = text.replace(/^(my\s+name\s+is|i\s+am|mera\s+naam|student\s+name\s+is|मेरा\s+नाम|नाम\s+है|विद्यार्थी)\s+/i, '');

  let studentClass;
  let section;

  const secKeywordMatch = text.match(/\b(?:section|sec|सेक्शन|वर्ग|भाग)\s*[:\-]?\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\b/i);
  if (secKeywordMatch) {
    const rawKey = secKeywordMatch[1].toLowerCase().trim();
    if (SECTION_NORMALIZER[rawKey]) {
      section = SECTION_NORMALIZER[rawKey];
    }
  }

  const hindiClassWordMatch = text.match(/\b(?:कक्षा|क्लास|वर्ग)\s*([^\s,]+)/);
  if (hindiClassWordMatch) {
    const word = hindiClassWordMatch[1];
    if (HINDI_CLASS_WORDS[word]) {
      studentClass = HINDI_CLASS_WORDS[word];
    } else if (/^\d+$/.test(word)) {
      studentClass = word;
    }
  }

  if (!studentClass) {
    const classMatch = text.match(/\b(?:class|grade|standard|kaksha|कक्षा|क्लास)\s*(\d{1,2})(?:st|nd|rd|th)?\b/i) ||
                       text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:class|grade|standard|कक्षा|क्लास)\b/i);
    if (classMatch) {
      studentClass = classMatch[1];
    }
  }

  if (!section && studentClass) {
    const directFollowSecMatch = text.match(new RegExp(`(?:\\b(?:class|grade|standard|कक्षा|क्लास)\\s*)?${studentClass}\\s*[-]?\\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\\b`, 'i'));
    if (directFollowSecMatch) {
      const raw = directFollowSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

  if (!section) {
    const trailingSecMatch = text.match(/\b(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\s*$/i);
    if (trailingSecMatch) {
      const raw = trailingSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

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

  let cleaned = text
    .replace(/\b(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)\s*\d{1,2}(?:st|nd|rd|th)?\b/gi, '')
    .replace(/\b(?:कक्षा|क्लास|वर्ग)\s*(?:छह|छः|सात|आठ|नौ|दस|ग्यारह|बारह)\b/g, '')
    .replace(/\b(?:section|sec|सेक्शन|वर्ग|भाग)\b/gi, '')
    .replace(/\b(?:bhi|भी|बी|bee|be|bi|bhee)\b/gi, '')
    .replace(/\b\d{1,2}\s*[-]?\s*[a-cA-C]\b/gi, '')
    .replace(/\b(6|7|8|9|10|11|12)\b/g, '')
    .replace(/\b[a-cA-Cए-सी]\b/g, '')
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
  const rawTranscript = query.rawTranscript.toLowerCase().trim();

  if (!normName && !rawTranscript) {
    return { student: null, confidence: 0, matches: [] };
  }

  const candidates = students.filter(s => {
    const sName = s.name.toLowerCase();
    const nameParts = sName.split(' ');
    const queryParts = normName.split(' ').filter(p => p.length >= 3);

    const matchesName =
      (normName.length >= 3 && (sName.includes(normName) || normName.includes(sName))) ||
      queryParts.some(part => sName.includes(part)) ||
      nameParts.some(part => normName.includes(part));

    if (!matchesName && normName.length >= 3) return false;

    if (query.studentClass && s.class !== query.studentClass) {
      return false;
    }
    if (query.section && s.section !== query.section) {
      return false;
    }
    return true;
  });

  if (candidates.length >= 1) {
    return { student: candidates[0], confidence: 1.0, matches: candidates };
  }

  return { student: null, confidence: 0, matches: [] };
}

const testHindiInputs = [
  'राहुल शर्मा कक्षा 9 बी',
  'राहुल शर्मा कक्षा 9 भी',
  'राहुल शर्मा कक्षा 9 b',
  'राहुल शर्मा कक्षा 9',
  'राहुल शर्मा 9 बी',
  'राहुल शर्मा 9 भी',
  'राहुल शर्मा 9 b',
  'राहुल शर्मा क्लास 9 बी',
  'राहुल शर्मा'
];

testHindiInputs.forEach(inp => {
  const q = parseVoiceInput(inp);
  const res = findStudentByVoice(q, students);
  console.log(`"${inp}" => parsed: { name: "${q.name}", class: "${q.studentClass}", section: "${q.section}" } => Match: ${res.student ? res.student.name + ' (' + res.student.class + '-' + res.student.section + ')' : 'NONE'}`);
});
