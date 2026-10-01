import type { StudentRecord } from '../types';

export interface ParsedVoiceQuery {
  rawTranscript: string;
  name: string;
  studentClass?: string;
  section?: string;
}

// Map of Hindi Devanagari numerals to English digits
const HINDI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// Map of spoken numbers/words for classes (1 to 12) in both English and Hindi
const CLASS_WORDS: Record<string, string> = {
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

// Map of spoken section variations (handles "bhi", "भी", "bee", "be", sound-alikes like "8", "3", etc.)
const SECTION_NORMALIZER: Record<string, string> = {
  // Section A
  'a': 'A', 'ay': 'A', 'ae': 'A', 'eh': 'A', 'hey': 'A', 'eight': 'A', '8': 'A', 'ate': 'A', 'one': 'A', '1': 'A', 'apple': 'A', 'ए': 'A', 'अ': 'A',
  // Section B (CRITICAL: Speech engines frequently transcribe "B" as "bhi", "भी", "bee", "be", "bi")
  'b': 'B', 'bhi': 'B', 'भी': 'B', 'बी': 'B', 'ब': 'B', 'bee': 'B', 'be': 'B', 'bi': 'B', 'bhee': 'B', 'two': 'B', '2': 'B', 'ball': 'B', 'boy': 'B',
  // Section C
  'c': 'C', 'सी': 'C', 'स': 'C', 'see': 'C', 'sea': 'C', 'si': 'C', 'three': 'C', '3': 'C', 'cat': 'C',
  // Section D
  'd': 'D', 'डी': 'D', 'dee': 'D', 'four': 'D', '4': 'D', 'dog': 'D',
};

// Fast Devanagari to Latin phonetic transliteration map
const DEVANAGARI_CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy', 'श्र': 'shr',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f'
};

const DEVANAGARI_VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': ''
};

// Standard known Indian name transliterations for instant 100% precision
const COMMON_HINDI_NAMES: Record<string, string> = {
  // First names
  'राहुल': 'rahul', 'शर्मा': 'sharma',
  'अनन्या': 'ananya', 'वर्मा': 'verma',
  'विहान': 'vihaan', 'गुप्ता': 'gupta',
  'दिया': 'diya', 'पटेल': 'patel',
  'कबीर': 'kabir', 'सिंह': 'singh',
  'प्रिया': 'priya', 'मेहता': 'mehta',
  'आरव': 'aarav', 'रोहन': 'rohan',
  'ईशान': 'ishaan', 'आदित्य': 'aditya',
  'अदिति': 'aditi', 'अद्वैत': 'advait',
  'अक्षरा': 'akshara', 'आलोक': 'alok',
  'आर्यन': 'aryan', 'आयुष': 'ayush',
  'भव्य': 'bhavya', 'भव्या': 'bhavya',
  'चेतन': 'chetan', 'देव': 'dev',
  'ध्रुव': 'dhruv', 'गौरव': 'gaurav',
  'हर्ष': 'harsh', 'ईशा': 'isha',
  'जय': 'jay', 'जया': 'jaya',
  'काव्या': 'kavya', 'करण': 'karan',
  'खुशी': 'khushi', 'कुणाल': 'kunal',
  'लक्ष्य': 'laksh', 'लक्ष': 'laksh',
  'मानव': 'manav', 'मीरा': 'meera',
  'मिहिर': 'mihir', 'नव्या': 'navya',
  'निखिल': 'nikhil', 'नेहा': 'neha',
  'ओम': 'om', 'पलक': 'palak',
  'प्रणव': 'pranav', 'पूजा': 'pooja',
  'राघव': 'raghav', 'रिया': 'rhea',
  'ऋषि': 'rishi', 'ऋतु': 'ritu',
  'रितु': 'ritu', 'साक्षी': 'sakshi',
  'समीर': 'sameer', 'सान्वी': 'sanvi',
  'सांवी': 'sanvi', 'सिद्धार्थ': 'siddharth',
  'सिमरन': 'simran', 'स्नेहा': 'sneha',
  'तनवी': 'tanvi', 'तन्वी': 'tanvi',
  'तरुण': 'tarun', 'उत्कर्ष': 'utkarsh',
  'वरुण': 'varun', 'विधि': 'vidhi',
  'यश': 'yash', 'ज़ोया': 'zoya',
  'जोया': 'zoya',

  // Names & Surnames from City Central School register
  'नमन': 'naman', 'अंशिका': 'anshika', 'विमल': 'vimal',
  'अथर्व': 'atharva', 'दैपुरिया': 'daipuriya', 'भूमिका': 'bhumika',
  'दिव्यांश': 'divyansh', 'गुर्जर': 'gurjar', 'गणेश': 'ganesh',
  'कपीश': 'kapeesh', 'कार्तिक': 'kartik', 'तोमर': 'tomar',
  'कृष्णा': 'krishna', 'भदौरिया': 'bhadouriya',
  'भदोरिया': 'bhadoriya', 'कुंज': 'kunj', 'राजपूत': 'rajput',
  'मान्या': 'manya', 'मुरली': 'murli', 'मनोहर': 'manohar',
  'नैतिक': 'naitik', 'पाखी': 'paakhi', 'चौहान': 'chauhan',
  'प्रिंस': 'prince', 'राधिका': 'radhika', 'राठौर': 'rathore',
  'ऋषिका': 'rishika', 'बघेल': 'baghel', 'रुद्र': 'rudra',
  'तिवारी': 'tiwari', 'सरस्वती': 'saraswati', 'सतवीर': 'satveer',
  'सात्विक': 'satvik', 'वर्धन': 'vardhan', 'शैलजा': 'shailja',
  'श्लोक': 'shlok', 'शौर्य': 'shorya', 'कटारे': 'katare',
  'सृष्टि': 'srashti', 'सूर्यांश': 'suryansh', 'श्रीवास्तव': 'shrivastav',
  'अभि': 'abhi', 'अभिनव': 'abhinav', 'अक्षत': 'akshit',
  'दीक्षित': 'dixit', 'अनमोल': 'anmol', 'चिराग': 'chirag',
  'देबू': 'debu', 'देविका': 'devika', 'गोविंद': 'govind',
  'हार्दिक': 'hardik', 'शुक्ला': 'shukla', 'लवकुश': 'lavkush',
  'मिलन': 'milan', 'मिष्टी': 'mishti', 'नंदिनी': 'nandinee',
  'प्रदुम': 'pradum', 'प्रिंजल': 'prinjal', 'प्रियांशी': 'priyanshi',
  'श्वेता': 'sweta', 'वैष्णवी': 'vaishnavi', 'विनय': 'vinay',
  'युवान': 'yuvan', 'आयुष्मान': 'ayushman', 'छाया': 'chaya',
  'गजानन': 'gajanan', 'ईशांत': 'ishant', 'जाट': 'jat',
  'इस्माइली': 'ismaili', 'महक': 'mahak', 'मानवी': 'manvi',
  'निश्चय': 'nishchay', 'पूरव': 'poorav', 'सार्थक': 'sarthak',
  'शिवांश': 'shivansh', 'तान्या': 'tanya', 'विक्रम': 'vikram',
  'विनायक': 'vinayak', 'उपाध्याय': 'upadhyay', 'आहना': 'aahna',
  'अद्रिति': 'adriti', 'अखिल': 'akhil', 'अनिरुद्ध': 'anirudh',
  'अंश': 'ansh', 'अर्णिका': 'arnika', 'अर्पण': 'arpan',
  'अर्पित': 'arpit', 'आशुतोष': 'ashtosh', 'देवेश': 'devesh',
  'हर्षित': 'harshit', 'जानवी': 'janvi', 'कृतिका': 'kratika',
  'गर्ग': 'garg', 'मोहित': 'mohit', 'नित्यम': 'nityam',
  'पार्थ': 'parth', 'प्रगति': 'pragti', 'रेयांशी': 'reyanshi',
  'सत्यम': 'satyam', 'कुशवाह': 'kushwah', 'श्रेयष्ठ': 'shreshth',
  'सौरभ': 'sourabh', 'अभय': 'abhay', 'राजावत': 'rajawat',
  'अविनाश': 'avinash', 'अव्यां': 'avyan', 'गोपाल': 'gopal',
  'हनी': 'hani', 'कपिल': 'kapil', 'कृपाल': 'kripal',
  'कुश': 'kush', 'प्रशांत': 'prashant', 'ऋद्धि': 'riddhi',
  'शिव': 'shiv', 'लोधी': 'lodhi', 'शिवांगी': 'shivangi',
  'विशेष': 'vishesh', 'यक्षित': 'yakshit', 'यशराज': 'yashraj',
  'आकृति': 'aakriti', 'अंशुल': 'anshul', 'अपर्णा': 'aparna',
  'चांसी': 'chancy', 'दक्ष': 'daksh', 'माधव': 'madhav',
  'मंगल': 'mangal', 'मोहिनी': 'mohini', 'नक्ष': 'naksh',
  'ओमहरि': 'omhari', 'प्रतिभा': 'pratibha', 'सहदीप': 'sahdeep',
  'तन्मय': 'tanmay', 'अद्विक': 'advik', 'आरब': 'arabh',
  'आरंश': 'aransh', 'भार्गवी': 'bhargavi', 'गौरी': 'gouri',
  'हरी': 'hari', 'हर्षिता': 'harshita', 'जयवर्धन': 'jayvardhan',
  'कुशल': 'kushal', 'धोलपुरिया': 'dholpuriya', 'ताराना': 'tarana',
  'विश्व': 'vishv', 'युवराज': 'yuvraj', 'आरुष': 'aarush',
  'चौबे': 'chaubey', 'अजीत': 'ajit', 'अरुण': 'arun',
  'कामिनी': 'kamini', 'रीतिका': 'ritika', 'मयंक': 'mayank',
  'पुनीत': 'punit', 'ऋचा': 'richa', 'रुत्वी': 'rutvi',
  'सक्षम': 'saksham', 'शिवान्या': 'shivanya', 'शिवी': 'shivi',
  'शोरव': 'shorav', 'सौम्या': 'somya', 'ओझा': 'ojha',
  'तेजस्वी': 'tejasvi', 'वंशिका': 'vanshika', 'वीर': 'veer',
  'योगेंद्र': 'yogendra', 'जादौन': 'jadaun', 'अनाया': 'anaya',
  'अनुरोध': 'anurodh', 'अनुराग': 'anurag', 'अर्णव': 'arnav',
  'अंकिता': 'ankita', 'अमन': 'aman', 'अमृता': 'amrta',
  'अनंत': 'anant', 'अंकुश': 'ankush', 'अर्यमन': 'aryaman',
  'ध्रुविका': 'dhruvika', 'दिव्य': 'divy', 'हेमंत': 'hemant',
  'पुरोहित': 'purohit', 'लाली': 'lali', 'मनीज्ञा': 'manigya',
  'नवीन': 'naveen', 'पुष्पेंद्र': 'puspendra', 'रागिनी': 'ragini',
  'रियांश': 'riyansh', 'सलमान': 'salman', 'खान': 'khan',
  'सारिका': 'sarika', 'शिवकार': 'shivakar', 'उजाला': 'ujala',
  'अभिजीत': 'abhijit', 'अनुज': 'anuj', 'आर्या': 'arya',
  'अवनि': 'avni', 'भूपेंद्र': 'bhupendra', 'दीपेंद्र': 'dipendra',
  'मवई': 'mavai', 'गरिमा': 'garima', 'जिगर': 'jigar',
  'केशनी': 'keshni', 'नीशू': 'neeshu', 'प्राची': 'prachi',
  'ऋषभ': 'rishabh', 'त्रिवेदी': 'trivedi', 'स्वाति': 'swati',
  'नरवरिया': 'narwariya', 'उमेश': 'umesh', 'विवेक': 'vivek',
  'याशी': 'yashi', 'परिहार': 'parihar', 'अभिषेक': 'abhishek',
  'अधीश': 'adheesh', 'अमित': 'amit', 'अनाय': 'anay',
  'अन्वी': 'anvi', 'आशी': 'ashi', 'देशराज': 'deshraj',
  'गुंजन': 'gunjan', 'मनीष': 'manish', 'नित्या': 'nitya',
  'सोनी': 'soni', 'रवीना': 'ravina', 'रीतिक': 'ritik',
  'सीनु': 'seenu', 'योगिता': 'yogita',

  // Surnames
  'कुमार': 'kumar', 'अय्यर': 'iyer',
  'नायर': 'nair', 'चोपड़ा': 'chopra',
  'बोस': 'bose', 'रेड्डी': 'reddy',
  'राव': 'rao', 'जोशी': 'joshi',
  'मिश्रा': 'mishra', 'पांडेय': 'pandey',
  'पांडे': 'pandey', 'सक्सेना': 'saxena',
  'मुखर्जी': 'mukherjee', 'दास': 'das',
  'सेन': 'sen', 'मल्होत्रा': 'malhotra',
  'भाटिया': 'bhatia', 'कपूर': 'kapoor',
  'अग्रवाल': 'agarwal', 'बंसल': 'bansal',
  'गोयल': 'goyal', 'जैन': 'jain',
  'शाह': 'shah', 'यादव': 'yadav'
};

function transliterateDevanagari(text: string): string {
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

export interface ParsedVoiceQuery {
  rawTranscript: string;
  name: string;
  studentClass?: string;
  section?: string;
  rollNo?: number;
}

// Intelligent text merger for multi-utterance tablet speech recognition
// Merges previously spoken words with current speech chunks while eliminating duplicate overlaps
export function mergeSpokenText(previous: string, current: string): string {
  const p = (previous || '').trim();
  const c = (current || '').trim();
  if (!p) return c;
  if (!c) return p;

  const pLower = p.toLowerCase();
  const cLower = c.toLowerCase();

  // If current speech already contains the full previous transcript
  if (cLower.startsWith(pLower)) return c;
  if (pLower.endsWith(cLower)) return p;
  if (pLower.includes(cLower)) return p;

  // Check word overlap: e.g. prev ends with words that curr starts with
  const pWords = p.split(/\s+/);
  const cWords = c.split(/\s+/);

  for (let len = Math.min(pWords.length, cWords.length); len > 0; len--) {
    const pSlice = pWords.slice(pWords.length - len).join(' ').toLowerCase();
    const cSlice = cWords.slice(0, len).join(' ').toLowerCase();
    if (pSlice === cSlice) {
      return pWords.slice(0, pWords.length - len).concat(cWords).join(' ');
    }
  }

  return `${p} ${c}`;
}

export function parseVoiceInput(transcript: string): ParsedVoiceQuery {
  // Strip punctuation and normalize Devanagari numerals
  let text = transcript.replace(/[।,!?;:\-_'\"()]/g, ' ').trim();
  text = text.replace(/[०-९]/g, ch => HINDI_DIGITS[ch] || ch);

  // Separate attached class and section digits/letters: e.g. "2B" -> "2 B", "4A" -> "4 A", "2बी" -> "2 बी"
  text = text.replace(/(\d+)\s*([a-zA-Z\u0900-\u097F])/g, '$1 $2');
  text = text.replace(/([a-zA-Z\u0900-\u097F])\s*(\d+)/g, '$1 $2');

  let studentClass: string | undefined;
  let section: string | undefined;
  let rollNo: number | undefined;

  // 1. Extract Roll Number if spoken:
  // e.g. "roll no 9960", "roll 9960", "रोल नंबर 9960", "क्रमांक 9960", "number 9960", "नंबर 9960"
  const rollMatch = text.match(/(?:roll\s*(?:no|number)?|रोल\s*(?:नंबर)?|क्रमांक|number|नंबर)\s*[:\-]?\s*(\d+)/i);
  if (rollMatch) {
    rollNo = parseInt(rollMatch[1], 10);
  } else {
    // Standalone 4-digit roll number (all roll numbers in school dataset are 6000-9999)
    const standalone4Digit = text.match(/\b([6-9]\d{3})\b/);
    if (standalone4Digit) {
      rollNo = parseInt(standalone4Digit[1], 10);
    }
  }

  // Pre-sorted regex lists
  const classWordsList = Object.keys(CLASS_WORDS).sort((a, b) => b.length - a.length).join('|');
  const secTokensList = Object.keys(SECTION_NORMALIZER).sort((a, b) => b.length - a.length).join('|');

  // 2. High-precision Combined Class + Section detection
  // Matches "2A", "2 बी", "class two a", "class to a", "kaksha 2 b", "कक्षा दो ए", "4-B", "5 B", "2 B section"
  const combinedRegex = new RegExp(
    `(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)?\\s*(?:^|\\s|[^\\w\\u0900-\\u097F])(${classWordsList})(?:th|st|nd|rd|वीं|वी)?\\s*[-/]?\\s*(?:section|sec|session|selection|सेक्शन|वर्ग|भाग)?\\s*[:\\-]?(?:\\s|[^\\w\\u0900-\\u097F])*(${secTokensList})(?:$|\\s|[^\\w\\u0900-\\u097F])`,
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
      `(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)\\s*[:\\-]?(?:\\s|[^\\w\\u0900-\\u097F])*(${classWordsList}|\\d{1,2})(?:$|\\s|[^\\w\\u0900-\\u097F])`,
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
      `(?:^|\\s|[^\\w\\u0900-\\u097F])(${classWordsList})\\s*(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)(?:$|\\s|[^\\w\\u0900-\\u097F])`,
      'i'
    );
    const m = text.match(invClassRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (CLASS_WORDS[raw]) studentClass = CLASS_WORDS[raw];
    }
  }

  // 5a. Section keyword prefix match: "section b", "sec a", "सेक्शन बी", "sec bhi"
  if (!section) {
    const secPrefixRegex = new RegExp(
      `(?:section|sec|session|selection|action|सेक्शन|वर्ग|भाग)\\s*[:\\-]?(?:\\s|[^\\w\\u0900-\\u097F])*(${secTokensList})(?:$|\\s|[^\\w\\u0900-\\u097F])`,
      'i'
    );
    const m = text.match(secPrefixRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) section = SECTION_NORMALIZER[raw];
    }
  }

  // 5b. Inverted Section keyword match: "B section", "A section", "C section", "bhi section", "बी सेक्शन", "भी सेक्शन"
  if (!section) {
    const invSecRegex = new RegExp(
      `(?:^|\\s|[^\\w\\u0900-\\u097F])(${secTokensList})\\s*(?:section|sec|session|selection|action|सेक्शन|वर्ग|भाग)(?:$|\\s|[^\\w\\u0900-\\u097F])`,
      'i'
    );
    const m = text.match(invSecRegex);
    if (m) {
      const raw = m[1].toLowerCase().trim();
      if (SECTION_NORMALIZER[raw]) section = SECTION_NORMALIZER[raw];
    }
  }

  // 6. Trailing section token at the end of speech: e.g. "... b", "... bhi", "... A", "... बी", "... ए"
  if (!section) {
    const trailingSecRegex = new RegExp(`(?:^|\\s|[^\\w\\u0900-\\u097F])(${secTokensList})\\s*$`, 'i');
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

  // 8. Clean text thoroughly to isolate the Student Name
  let cleaned = text
    // Remove conversational phrases
    .replace(/^(my\s+name\s+is|i\s+am|mera\s+naam|student\s+name\s+is|मेरा\s+नाम|मेरे\s+बेटे\s+का\s+नाम|बच्चे\s+का\s+नाम|विद्यार्थी\s+का\s+नाम|छात्र\s+का\s+नाम|विद्यार्थी|छात्र)\s+/gi, '')
    .replace(/\s+(hai|है|ka\s+result|का\s+परिणाम|का\s+रिजल्ट|की\s+मार्कशीट)\s*$/gi, '')
    // Remove roll numbers
    .replace(/(?:roll\s*(?:no|number)?|रोल\s*(?:नंबर)?|क्रमांक|number|नंबर)\s*[:\-]?\s*\d+/gi, '')
    // Remove class phrases
    .replace(/(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)\s*[:\-]?\s*(?:\d{1,2}|one|two|to|too|three|four|for|five|second|third|fourth|fifth|2nd|3rd|4th|5th|एक|दो|तीन|चार|पांच|पाँच|दूसरी|तीसरी|चौथी|पांचवीं)(?:th|st|nd|rd|वीं|वी)?/gi, '')
    .replace(/(?:first|second|third|fourth|fifth|2nd|3rd|4th|5th|दूसरी|तीसरी|चौथी|पांचवीं)\s*(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग)/gi, '')
    .replace(/(?:class|grade|standard|kaksha|कक्षा|क्लास|वर्ग|std)/gi, '')
    // Remove section phrases
    .replace(/(?:section|sec|session|selection|action|सेक्शन|वर्ग|भाग)\s*[:\-]?\s*(?:bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स|d|dee|डी|eight|8|three|3|two|2|one|1)?/gi, '')
    .replace(/(?:bhi|भी|बी|ब|bee|be|bi|bhee|b|ay|ae|a|ए|अ|see|sea|si|c|सी|स|d|dee|डी)\s*(?:section|sec|session|selection|action|सेक्शन|वर्ग|भाग)/gi, '')
    .replace(/(?:^|\s)(?:bhi|भी|बी|bee|be|bi|bhee|ay|ae|see|sea|si)(?:\s|$)/gi, ' ');

  // If section was detected, cleanly remove section letters from name
  if (section) {
    cleaned = cleaned.replace(new RegExp(`\\b${section}\\b`, 'gi'), ' ');
  }
  // If class was detected, cleanly remove class number from name
  if (studentClass) {
    cleaned = cleaned.replace(new RegExp(`\\b${studentClass}(?:th|st|nd|rd|वीं|वी)?\\b`, 'gi'), ' ');
  }

  cleaned = cleaned
    .replace(/(?:^|\s)[a-dA-Dए-सीबअ]\s*$/gi, ' ')
    // Remove standalone digits
    .replace(/(?:^|\s)(?:[1-9]|1[0-2])(?:th|st|nd|rd|वीं|वी)?(?:\s|$)/gi, ' ')
    .replace(/\d+/g, '')
    .replace(/\b(?:th|st|nd|rd|hai|ka|ki|ke|का|की|के|है|हूँ|हूं)\b/gi, ' ')
    .trim();

  // If text contains Devanagari script, transliterate to Latin using dictionary + phonetic
  let transliteratedName = cleaned;
  if (/[\u0900-\u097F]/.test(cleaned)) {
    transliteratedName = transliterateDevanagari(cleaned);
  }

  // Final clean name (letters and spaces only)
  let name = transliteratedName
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    rawTranscript: transcript,
    name,
    studentClass,
    section,
    rollNo
  };
}

export function findStudentByVoice(
  query: ParsedVoiceQuery,
  students: StudentRecord[]
): { student: StudentRecord | null; confidence: number; matches: StudentRecord[] } {
  const normName = query.name.toLowerCase().trim();
  const rawTranscript = query.rawTranscript.toLowerCase().trim();

  // 1. Match by Roll Number if spoken
  if (query.rollNo) {
    const rollMatches = students.filter(s => {
      if (s.roll_no !== query.rollNo) return false;
      if (query.studentClass && s.class !== query.studentClass) return false;
      if (query.section && s.section.toUpperCase() !== query.section.toUpperCase()) return false;
      return true;
    });
    if (rollMatches.length === 1) {
      return { student: rollMatches[0], confidence: 1.0, matches: rollMatches };
    }
    if (rollMatches.length > 1) {
      if (normName) {
        const nameMatch = rollMatches.find(s => s.name.toLowerCase().includes(normName) || normName.includes(s.name.toLowerCase()));
        if (nameMatch) return { student: nameMatch, confidence: 1.0, matches: [nameMatch] };
      }
      return { student: rollMatches[0], confidence: 0.9, matches: rollMatches };
    }
  }

  if (!normName && !rawTranscript) {
    return { student: null, confidence: 0, matches: [] };
  }

  // 2. Strict Requirement: Both Class and Section are mandatory alongside Name (unless Roll No is provided)
  if (!query.studentClass || !query.section) {
    // Cannot search without both Class and Section: return no result
    return { student: null, confidence: 0, matches: [] };
  }

  // 3. Strictly search within the specified Class & Section
  const scopedStudents = students.filter(
    s => s.class === query.studentClass && s.section.toUpperCase() === query.section?.toUpperCase()
  );

  if (scopedStudents.length === 0) {
    // Specified class & section has no students
    return { student: null, confidence: 0, matches: [] };
  }

  // Exact full name match in specified class & section
  const exactName = scopedStudents.find(s => s.name.toLowerCase() === normName);
  if (exactName) {
    return { student: exactName, confidence: 1.0, matches: [exactName] };
  }

  // All query words match inside student's name
  const queryParts = normName.split(' ').filter(p => p.length >= 2);
  if (queryParts.length > 0) {
    const allPartsMatch = scopedStudents.filter(s => {
      const sName = s.name.toLowerCase();
      return queryParts.every(part => sName.includes(part));
    });
    if (allPartsMatch.length === 1) {
      return { student: allPartsMatch[0], confidence: 0.95, matches: allPartsMatch };
    }
  }

  // Substring match (either query contains student name or student name contains query)
  const substringMatches = scopedStudents.filter(s => {
    const sName = s.name.toLowerCase();
    return (normName.length >= 3 && sName.includes(normName)) || (sName.length >= 3 && normName.includes(sName));
  });
  if (substringMatches.length === 1) {
    return { student: substringMatches[0], confidence: 0.9, matches: substringMatches };
  }

  // First name match within this specific section (if unique in this section)
  if (normName.length >= 3) {
    const firstWord = normName.split(' ')[0];
    if (firstWord.length >= 3) {
      const firstNameMatches = scopedStudents.filter(s => s.name.toLowerCase().startsWith(firstWord));
      if (firstNameMatches.length === 1) {
        return { student: firstNameMatches[0], confidence: 0.85, matches: firstNameMatches };
      }
    }
  }

  // Strict: No student found matching this name in the given class and section
  return { student: null, confidence: 0, matches: [] };
}

