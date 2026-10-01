const HINDI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const CLASS_WORDS = {
  // English digits & words
  '1': '1', 'one': '1', 'first': '1', '1st': '1',
  '2': '2', 'two': '2', 'to': '2', 'too': '2', 'tu': '2', 'second': '2', '2nd': '2',
  '3': '3', 'three': '3', 'third': '3', '3rd': '3', 'tree': '3',
  '4': '4', 'four': '4', 'for': '4', 'fore': '4', 'fourth': '4', '4th': '4',
  '5': '5', 'five': '5', 'fifth': '5', '5th': '5',
  '6': '6', 'six': '6', 'sixth': '6', '6th': '6',
  '7': '7', 'seven': '7', 'seventh': '7', '7th': '7',
  '8': '8', 'eight': '8', 'eighth': '8', '8th': '8', 'ate': '8',
  '9': '9', 'nine': '9', 'ninth': '9', '9th': '9',
  '10': '10', 'ten': '10', 'tenth': '10', '10th': '10',
  '11': '11', 'eleven': '11', '11th': '11',
  '12': '12', 'twelve': '12', '12th': '12',

  // Hindi words
  'एक': '1', 'पहली': '1', 'वन': '1', 'फ़र्स्ट': '1',
  'दो': '2', 'दूसरी': '2', 'टू': '2', 'सेकंड': '2',
  'तीन': '3', 'तीसरी': '3', 'थ्री': '3', 'थर्ड': '3',
  'चार': '4', 'चौथी': '4', 'फोर': '4', 'फ़ोर्थ': '4',
  'पांच': '5', 'पाँच': '5', 'पांचवीं': '5', 'पाँचवीं': '5', 'फाइव': '5', 'फ़िफ़्थ': '5',
  'छह': '6', 'छः': '6', 'छठी': '6', 'सिक्स': '6',
  'सात': '7', 'सातवीं': '7', 'सेवन': '7',
  'आठ': '8', 'आठवीं': '8', 'एट': '8',
  'नौ': '9', 'नवी': '9', 'नवमी': '9', 'नौवीं': '9', 'नाइन': '9',
  'दस': '10', 'दसवीं': '10', 'टेन': '10',
  'ग्यारह': '11', 'ग्यारहवीं': '11', 'इलेवन': '11',
  'बारह': '12', 'बारहवीं': '12', 'ट्वेल्व': '12',
};

const SECTION_NORMALIZER = {
  'a': 'A', 'ay': 'A', 'ae': 'A', 'ए': 'A', 'अ': 'A', 'apple': 'A',
  'b': 'B', 'bhi': 'B', 'भी': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bi': 'B', 'bhee': 'B', 'ball': 'B', 'boy': 'B',
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C', 'cat': 'C',
  'd': 'D', 'डी': 'D', 'dee': 'D', 'dog': 'D',
};

function parseVoiceInput(transcript) {
  let text = transcript.replace(/[।,!?;:\-_'\"()]/g, ' ').trim();
  text = text.replace(/[०-९]/g, ch => HINDI_DIGITS[ch] || ch);

  let studentClass;
  let section;
  let rollNo;

  // 1. Roll No
  const rollMatch = text.match(/(?:roll\s*(?:no|number)?|रोल\s*(?:नंबर)?|क्रमांक)\s*[:\-]?\s*(\d+)/i);
  if (rollMatch) {
    rollNo = parseInt(rollMatch[1], 10);
  }

  // Helper boundary: works for both Latin and Devanagari
  const classWordsList = Object.keys(CLASS_WORDS).sort((a, b) => b.length - a.length).join('|');
  const secTokensList = Object.keys(SECTION_NORMALIZER).sort((a, b) => b.length - a.length).join('|');

  // 2. High precision combined: e.g. "class 2 a", "class two a", "kaksha 2 b", "कक्षा दो ए", "क्लास 2 बी", "4-B"
  const combinedRegex = new RegExp(
    `(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)?\\s*(?:^|\\s|[^\w\u0900-\u097F])(${classWordsList})(?:th|st|nd|rd|वीं|वी)?\\s*[-/]?\\s*(?:section|sec|सेक्शन|वर्ग|भाग)?\\s*[:\\-]?(?:\\s|[^\w\u0900-\u097F])*(${secTokensList})(?:$|\\s|[^\w\u0900-\u097F])`,
    'i'
  );

  const combinedMatch = text.match(combinedRegex);
  if (combinedMatch) {
    const rawClass = combinedMatch[1].toLowerCase().trim();
    if (CLASS_WORDS[rawClass]) studentClass = CLASS_WORDS[rawClass];

    const rawSec = combinedMatch[2].toLowerCase().trim();
    if (SECTION_NORMALIZER[rawSec]) section = SECTION_NORMALIZER[rawSec];
  }

  // 3. Class specified with prefix keyword: e.g. "class two", "class 2", "kaksha 4", "कक्षा दो"
  if (!studentClass) {
    const classPrefixRegex = new RegExp(
      `(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)\\s*[:\\-]?(?:\\s|[^\w\u0900-\u097F])*(${classWordsList}|\\d{1,2})(?:$|\\s|[^\w\u0900-\u097F])`,
      'i'
    );
    const m = text.match(classPrefixRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (CLASS_WORDS[raw]) {
        studentClass = CLASS_WORDS[raw];
      } else if (/^\d+$/.test(raw) && parseInt(raw, 10) >= 1 && parseInt(raw, 10) <= 12) {
        studentClass = String(parseInt(raw, 10));
      }
    }
  }

  // 4. Inverted class prefix: e.g. "second class", "2nd class", "दूसरी कक्षा"
  if (!studentClass) {
    const invClassRegex = new RegExp(
      `(?:^|\\s|[^\w\u0900-\u097F])(${classWordsList})\\s*(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)(?:$|\\s|[^\w\u0900-\u097F])`,
      'i'
    );
    const m = text.match(invClassRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (CLASS_WORDS[raw]) studentClass = CLASS_WORDS[raw];
    }
  }

  // 5. Section keyword match: "section b", "sec a", "सेक्शन बी", "sec bhi"
  if (!section) {
    const secPrefixRegex = new RegExp(
      `(?:section|sec|सेक्शन|वर्ग|भाग)\\s*[:\\-]?(?:\\s|[^\w\u0900-\u097F])*(${secTokensList})(?:$|\\s|[^\w\u0900-\u097F])`,
      'i'
    );
    const m = text.match(secPrefixRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) section = SECTION_NORMALIZER[raw];
    }
  }

  // 6. Trailing section token at the end of speech: e.g. "... b", "... bhi", "... A", "... बी", "... ए"
  if (!section) {
    const trailingSecRegex = new RegExp(`(?:^|\\s|[^\w\u0900-\u097F])(${secTokensList})\\s*$`, 'i');
    const m = text.match(trailingSecRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) section = SECTION_NORMALIZER[raw];
    }
  }

  // 7. Fallback class: isolated single digit (1-12)
  if (!studentClass) {
    const isolatedDigitMatch = text.match(/(?:^|\s)([1-9]|1[0-2])(?:th|st|nd|rd|वीं|वी)?(?:\s|$)/i);
    if (isolatedDigitMatch) {
      studentClass = isolatedDigitMatch[1];
    }
  }

  return { studentClass, section, rollNo };
}

// Test multiple variations
const testCases = [
  { text: "Naman Sharma class 2 a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class two a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class to a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class too a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class 2 section a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class two section a", expClass: "2", expSec: "A" },
  { text: "Naman Sharma 2 A", expClass: "2", expSec: "A" },
  { text: "Naman Sharma 2nd A", expClass: "2", expSec: "A" },
  { text: "Naman Sharma second class A", expClass: "2", expSec: "A" },
  { text: "Naman Sharma class 4 B", expClass: "4", expSec: "B" },
  { text: "Naman Sharma class for B", expClass: "4", expSec: "B" },
  { text: "Naman Sharma class four B", expClass: "4", expSec: "B" },
  { text: "Naman Sharma class 4 bhi", expClass: "4", expSec: "B" },
  { text: "नमन शर्मा कक्षा 2 ए", expClass: "2", expSec: "A" },
  { text: "नमन शर्मा कक्षा दो ए", expClass: "2", expSec: "A" },
  { text: "नमन शर्मा क्लास 2 बी", expClass: "2", expSec: "B" },
  { text: "नमन शर्मा क्लास दो बी", expClass: "2", expSec: "B" },
  { text: "नमन शर्मा कक्षा दूसरी बी", expClass: "2", expSec: "B" },
  { text: "Kartik Sharma class 5 B", expClass: "5", expSec: "B" },
  { text: "Kartik Sharma class five section B", expClass: "5", expSec: "B" }
];

console.log("=== TESTING ALL CLASS & SECTION SPOKEN VARIATIONS ===");
let allPassed = true;
testCases.forEach(tc => {
  const res = parseVoiceInput(tc.text);
  const passed = res.studentClass === tc.expClass && res.section === tc.expSec;
  if (!passed) allPassed = false;
  console.log(`"${tc.text}" -> Class: ${res.studentClass} (exp: ${tc.expClass}), Sec: ${res.section} (exp: ${tc.expSec}) => ${passed ? '✅' : '❌ FAIL'}`);
});

console.log("\nOVERALL STATUS:", allPassed ? "ALL 20 PASSED! 🎉" : "SOME FAILED ⚠️");
