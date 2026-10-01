const fs = require('fs');
const path = require('path');

// Read real students
const students = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/realStudentRecords.json'), 'utf8'));

// Test parsing logic
const SECTION_NORMALIZER = {
  'a': 'A', 'ए': 'A', 'अ': 'A', 'ay': 'A', 'ae': 'A',
  'b': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bhi': 'B', 'भी': 'B', 'bi': 'B', 'bhee': 'B',
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C',
};

const HINDI_CLASS_WORDS = {
  'दो': '2', 'दूसरी': '2', '2nd': '2',
  'तीन': '3', 'तीसरी': '3', '3rd': '3',
  'चार': '4', 'चौथी': '4', '4th': '4',
  'पांच': '5', 'पाँच': '5', 'पांचवीं': '5', '5th': '5'
};

function parseQuery(text) {
  let studentClass;
  let section;
  let rollNo;

  const rollMatch = text.match(/(?:roll\s*(?:no|number)?|रोल\s*(?:नंबर)?|क्रमांक)\s*[:\-]?\s*(\d+)/i);
  if (rollMatch) rollNo = parseInt(rollMatch[1], 10);

  const combinedMatch = text.match(/(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)?\s*(?:^|[^\d])([1-9]|1[0-2])(?:th|st|nd|rd|वीं|वी)?\s*[-/]?\s*(?:section|sec|सेक्शन|वर्ग|भाग)?\s*[:\-]?\s*(bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स|d|dee|डी)(?:\s|$|[^\w\u0900-\u097F])/i);
  if (combinedMatch) {
    studentClass = combinedMatch[1];
    const rawSec = combinedMatch[2].toLowerCase().trim();
    if (SECTION_NORMALIZER[rawSec]) section = SECTION_NORMALIZER[rawSec];
  }

  // Clean name
  let name = text
    .replace(/(?:roll\s*(?:no|number)?|रोल\s*(?:नंबर)?|क्रमांक)\s*[:\-]?\s*\d+/gi, '')
    .replace(/(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)\s*\d+(?:th|st|nd|rd|वीं|वी)?/gi, '')
    .replace(/(?:section|sec|सेक्शन|वर्ग|भाग)\s*[:\-]?\s*(?:bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स|d|dee|डी)?/gi, '')
    .replace(/(?:^|\s)(?:bhi|भी|बी|bee|be|bi|bhee|ay|ae|see|sea|si)(?:\s|$)/gi, ' ')
    .replace(/\d+/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { name, studentClass, section, rollNo };
}

function findStudent(query) {
  const normName = (query.name || '').toLowerCase().trim();

  if (query.rollNo) {
    const rollMatch = students.find(s => s.roll_no === query.rollNo);
    if (rollMatch) return rollMatch;
  }

  if (query.studentClass && query.section) {
    const scoped = students.filter(s => s.class === query.studentClass && s.section === query.section);
    const exact = scoped.find(s => s.name.toLowerCase() === normName);
    if (exact) return exact;

    const parts = normName.split(' ').filter(p => p.length >= 2);
    if (parts.length > 0) {
      const match = scoped.find(s => parts.every(p => s.name.toLowerCase().includes(p)));
      if (match) return match;
    }
    return null;
  }

  return null; // Strict: if class & section missing, don't loosely guess
}

// Test cases
const testPhrases = [
  { phrase: "Naman Sharma Class 2 Section A", expected: "NAMAN SHARMA" },
  { phrase: "Naman Sharma", expected: "WAIT_INCOMPLETE" },
  { phrase: "Naman Sharma Class 2", expected: "WAIT_INCOMPLETE" },
  { phrase: "Naman Sharma Class 2 Section B", expected: "RESULT_NOT_FOUND" },
  { phrase: "Unknown Student Class 3 Section A", expected: "RESULT_NOT_FOUND" },
  { phrase: "Roll Number 8442", expected: "NAMAN SHARMA" },
  { phrase: "Utkarsh Singh Bhadouriya Class 4 Section B", expected: "UTKARSH SINGH BHADOURIYA" }
];

console.log("=== STRICT VOICE SEARCH VERIFICATION ===");
testPhrases.forEach(tc => {
  const q = parseQuery(tc.phrase);
  const isComplete = (q.name && q.studentClass && q.section) || q.rollNo;
  let result;
  if (!isComplete) {
    result = "WAIT_INCOMPLETE";
  } else {
    const match = findStudent(q);
    result = match ? match.name : "RESULT_NOT_FOUND";
  }

  const passed = result === tc.expected;
  console.log(`Input: "${tc.phrase}"`);
  console.log(`Parsed -> Name: "${q.name}", Class: ${q.studentClass}, Sec: ${q.section}, Roll: ${q.rollNo}`);
  console.log(`Result: ${result} | Expected: ${tc.expected} -> ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
});
