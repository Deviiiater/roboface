// Test voice parsing logic directly
const SECTION_NORMALIZER = {
  'a': 'A', 'ay': 'A', 'ae': 'A', 'ए': 'A', 'अ': 'A',
  'b': 'B', 'bhi': 'B', 'भी': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bi': 'B', 'bhee': 'B',
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C',
};

const HINDI_CLASS_WORDS = {
  'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9', 'दस': '10', 'ग्यारह': '11', 'बारह': '12',
};

function parseVoiceInputTest(transcript) {
  let text = transcript.trim();
  text = text.replace(/^(my\s+name\s+is|i\s+am|mera\s+naam|student\s+name\s+is|मेरा\s+नाम|नाम\s+है|विद्यार्थी)\s+/i, '');

  let studentClass;
  let section;

  // 1. Keyword section
  const secKeywordMatch = text.match(/\b(?:section|sec|सेक्शन|वर्ग|भाग)\s*[:\-]?\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\b/i);
  if (secKeywordMatch) {
    const rawKey = secKeywordMatch[1].toLowerCase().trim();
    if (SECTION_NORMALIZER[rawKey]) {
      section = SECTION_NORMALIZER[rawKey];
    }
  }

  // 2. Class
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

  // 3. Direct follow
  if (!section && studentClass) {
    const directFollowSecMatch = text.match(new RegExp(`(?:\\b(?:class|grade|standard|कक्षा|क्लास)\\s*)?${studentClass}\\s*[-]?\\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\\b`, 'i'));
    if (directFollowSecMatch) {
      const raw = directFollowSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

  // 4. Trailing word
  if (!section) {
    const trailingSecMatch = text.match(/\b(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स)\s*$/i);
    if (trailingSecMatch) {
      const raw = trailingSecMatch[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) {
        section = SECTION_NORMALIZER[raw];
      }
    }
  }

  // Fallback class
  if (!studentClass) {
    const isolatedNum = text.match(/\b(6|7|8|9|10|11|12)\b/);
    if (isolatedNum) studentClass = isolatedNum[1];
  }

  // Clean name
  let cleaned = text
    .replace(/\b(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)\s*\d{1,2}(?:st|nd|rd|th)?\b/gi, '')
    .replace(/\b(?:कक्षा|क्लास|वर्ग)\s*(?:छह|छः|सात|आठ|नौ|दस|ग्यारह|बारह)\b/g, '')
    .replace(/\b(?:section|sec|सेक्शन|वर्ग|भाग)\b/gi, '')
    .replace(/\b(?:bhi|भी|बी|bee|be|bi|bhee)\b/gi, '')
    .replace(/\b\d{1,2}\s*[-]?\s*[a-cA-C]\b/gi, '')
    .replace(/\b(6|7|8|9|10|11|12)\b/g, '')
    .replace(/\b[a-cA-Cए-सी]\b/g, '')
    .trim();

  let name = cleaned.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();

  return { name, studentClass, section };
}

// Test queries
const testInputs = [
  'Rahul Sharma Class 9 bhi',
  'Rahul Sharma 9 bhi',
  'Rahul Sharma Class 9 section bhi',
  'Rahul Sharma class 9 B',
  'Rahul Sharma 9 B',
  'Ananya Verma 10 A',
  'Vihaan Gupta Class 8 section B',
  'Rahul Sharma class 9 bee',
  'Rahul Sharma class 9 bi'
];

testInputs.forEach(input => {
  const result = parseVoiceInputTest(input);
  console.log(`Input: "${input}" => Name: "${result.name}", Class: "${result.studentClass}", Section: "${result.section}"`);
});
