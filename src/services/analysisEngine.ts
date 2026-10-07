import { StudentRecord, StudentAnalysis, SubjectAnalysis, PerformanceThresholds, PerformanceTier } from '../types';

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  excellent: 90,
  veryGood: 75,
  good: 60,
  needsImprovement: 40,
};

// Deterministic subject-specific actionable improvement advice
const SUBJECT_IMPROVEMENT_TIPS: Record<string, string> = {
  'Mathematics': 'Practice 5 NCERT word problems daily, make a formula cheat sheet, and focus on step-by-step working.',
  'Science': 'Draw and label diagrams clearly, write down chemical equations/laws, and revise lab experiments.',
  'EVS': 'Review environmental chapters, observe nature and diagrams, and memorize short definitions and causes.',
  'G.K.': 'Read children’s quiz and fact books weekly; practice facts about India, states, and science.',
  'GK': 'Read children’s quiz and fact books weekly; practice facts about India, states, and science.',
  'Physics': 'Work through numerical problems and unit conversions weekly; clarify core derivations.',
  'Chemistry': 'Practice reaction mechanisms and periodic trends; revise formula charts before class tests.',
  'Biology': 'Practice biological diagrams and anatomical terminology; prepare mind maps for each chapter.',
  'English': 'Read 15 minutes of an editorial daily to improve vocabulary; practice writing formal letters and essays.',
  'Hindi': 'Vyakaran (grammar) and spelling revision needed. Practice writing paragraphs and reading comprehension.',
  'Social Science': 'Create timeline flashcards for History, practice map pointing for Geography, and make point-wise Civics notes.',
  'Computer': 'Practice logic flowcharts, dry-run code on paper, and write syntax exercises twice weekly.',
  'Computer Science': 'Debug code snippets regularly, master object-oriented concepts and SQL query syntax.',
  'Accountancy': 'Practice balance sheet formats and ledger entries daily; verify debit-credit balancing steps.',
  'Business Studies': 'Memorize headings and key management terms with real-world case studies.',
  'Economics': 'Draw micro and macro economic graphs neatly; learn formulas for national income and elasticity.',
  'Sanskrit': 'Practice Sanskrit grammar (Dhatu roop, Shabda roop), sandhi rules, and shloka meanings.',
  'Physical Education': 'Maintain fitness training logs, learn official game rules/dimensions, and revise health physiology concepts.',
  'Applied Maths': 'Practice commercial mathematics, statistics, numerical algorithms, and financial calculation models.',
  'History': 'Prepare chronological timeline charts, memorize key treaties and acts, and practice source-based analytical answers.',
  'Political Science': 'Review constitutional articles, landmark Supreme Court cases, and prepare structured essay answers.',
  'Geography': 'Practice topographical map pointing regularly, draw geographical phenomena diagrams, and revise climate factors.',
  'Sociology': 'Understand sociological theories with practical case studies from contemporary Indian society and memorize key definitions.'
};

export const HINDI_SUBJECT_NAMES: Record<string, string> = {
  'Mathematics': 'गणित',
  'Science': 'विज्ञान',
  'EVS': 'पर्यावरण (EVS)',
  'G.K.': 'सामान्य ज्ञान (G.K.)',
  'GK': 'सामान्य ज्ञान (G.K.)',
  'Physics': 'भौतिक विज्ञान',
  'Chemistry': 'रसायन विज्ञान',
  'Biology': 'जीव विज्ञान',
  'English': 'अंग्रेज़ी',
  'Hindi': 'हिंदी',
  'Social Science': 'सामाजिक विज्ञान',
  'Computer': 'कंप्यूटर',
  'Computer Science': 'कंप्यूटर साइंस',
  'Accountancy': 'लेखाशास्त्र',
  'Business Studies': 'व्यावसायिक अध्ययन',
  'Economics': 'अर्थशास्त्र',
  'Sanskrit': 'संस्कृत',
  'Physical Education': 'शारीरिक शिक्षा',
  'Applied Maths': 'एप्लाइड गणित',
  'History': 'इतिहास',
  'Political Science': 'राजनीति विज्ञान',
  'Geography': 'भूगोल',
  'Sociology': 'समाजशास्त्र'
};

export const HINDI_SUBJECT_IMPROVEMENT_TIPS: Record<string, string> = {
  'Mathematics': 'रोज़ाना 5 एनसीईआरटी प्रश्न हल करें, सूत्रों की सूची बनाएं और चरणबद्ध तरीके से उत्तर लिखें।',
  'Science': 'चित्रों का स्पष्ट अभ्यास करें, रासायनिक समीकरण लिखें और प्रयोगों को दोहराएं।',
  'EVS': 'पर्यावरण के अध्यायों को दोहराएं, चित्रों और परिभाषाओं को समझें और मुख्य बिंदुओं के नोट्स बनाएं।',
  'G.K.': 'सामान्य ज्ञान की प्रश्नोत्तरी का अभ्यास करें और भारत व विज्ञान के रोचक तथ्यों को याद करें।',
  'GK': 'सामान्य ज्ञान की प्रश्नोत्तरी का अभ्यास करें और भारत व विज्ञान के रोचक तथ्यों को याद करें।',
  'Physics': 'संख्यात्मक प्रश्नों और सूत्रों का साप्ताहिक अभ्यास करें।',
  'Chemistry': 'रासायनिक अभिक्रियाओं और आवर्त सारणी के नियमों को नियमित दोहराएं।',
  'Biology': 'जीव विज्ञान के चित्रों का अभ्यास करें और मुख्य शब्दावली के नोट्स बनाएं।',
  'English': 'शब्दावली सुधारने के लिए प्रतिदिन पठन करें और निबंध व पत्र लेखन का अभ्यास करें।',
  'Hindi': 'व्याकरण और वर्तनी का अभ्यास करें तथा अनुच्छेद लेखन पर ध्यान दें।',
  'Social Science': 'इतिहास के लिए समय-सारणी कार्ड बनाएं, भूगोल के लिए मानचित्र अभ्यास करें और नागरिक शास्त्र के बिंदुवार नोट्स बनाएं।',
  'Computer': 'लॉजिक फ़्लोचार्ट बनाएं और कोडिंग सिंटैक्स का साप्ताहिक अभ्यास करें।',
  'Computer Science': 'प्रोग्रामिंग कोड का नियमित अभ्यास करें और एसक्यूएल क्वेरी समझें।',
  'Accountancy': 'बैलेंस शीट और लेज़र प्रविष्टियों का दैनिक अभ्यास करें।',
  'Business Studies': 'प्रबंधन सिद्धांतों को याद करें और व्यावहारिक उदाहरणों से समझें।',
  'Economics': 'आर्थिक ग्राफ़ का अभ्यास करें और राष्ट्रीय आय के सूत्र याद करें।',
  'Sanskrit': 'संस्कृत व्याकरण, धातु रूप, शब्द रूप और श्लोकों के अर्थ का नियमित अभ्यास करें।',
  'Physical Education': 'स्वास्थ्य नियमों, खेल नियमावली और योग सिद्धांतों का नियमित अभ्यास करें।',
  'Applied Maths': 'वित्तीय गणित और सांख्यिकी प्रश्नों का चरणबद्ध अभ्यास करें।',
  'History': 'ऐतिहासिक समय-सारणी बनाएं, प्रमुख तिथियां याद करें और मानचित्र अभ्यास करें।',
  'Political Science': 'संविधान के अनुच्छेदों और समकालीन राजनीतिक मुद्दों के बिंदुवार नोट्स बनाएं।',
  'Geography': 'मानचित्रों पर स्थानों को चिह्नित करने का अभ्यास करें और आरेख बनाएं।',
  'Sociology': 'समाजशास्त्रीय अवधारणाओं और भारतीय समाज के उदाहरणों का नियमित अध्ययन करें।'
};

const DEFAULT_SUBJECT_TIP = 'Revise key concepts, maintain dedicated revision notes, and solve previous year questions weekly.';
const DEFAULT_HINDI_SUBJECT_TIP = 'मुख्य अवधारणाओं को दोहराएं, संक्षिप्त नोट्स बनाएं और पिछले वर्षों के प्रश्न हल करें।';

export function getTierForPercentage(pct: number, thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): { tier: PerformanceTier; guidance: string; grade: string } {
  if (pct >= thresholds.excellent) {
    return {
      tier: 'Excellent',
      guidance: 'Continue current study habits and challenge yourself with advanced problems.',
      grade: pct >= 95 ? 'A1+' : 'A1'
    };
  } else if (pct >= thresholds.veryGood) {
    return {
      tier: 'Very Good',
      guidance: 'Maintain consistency and strengthen difficult topics for upcoming exams.',
      grade: pct >= 82 ? 'A2' : 'B1'
    };
  } else if (pct >= thresholds.good) {
    return {
      tier: 'Good',
      guidance: 'Increase practice and revision in weaker topics to reach the next tier.',
      grade: pct >= 68 ? 'B2' : 'C1'
    };
  } else if (pct >= thresholds.needsImprovement) {
    return {
      tier: 'Needs Improvement',
      guidance: 'Regular practice, revision, and teacher guidance strongly recommended.',
      grade: pct >= 50 ? 'C2' : 'D'
    };
  } else {
    return {
      tier: 'Requires Attention',
      guidance: 'Focused support, concept revision, and parent-teacher collaboration recommended.',
      grade: 'E (Remedial)'
    };
  }
}

function getTierForSeniorGrade(gradeStr: string): { tier: PerformanceTier; guidance: string } {
  const g = (gradeStr || '').toUpperCase().trim();
  if (g.startsWith('A')) {
    return {
      tier: 'Excellent',
      guidance: 'Outstanding academic command. Continue focused preparations for competitive and board evaluations.'
    };
  } else if (g.startsWith('B')) {
    return {
      tier: 'Very Good',
      guidance: 'Strong subject grasp. Regular revisions and practice tests will elevate scores further.'
    };
  } else if (g === 'C1') {
    return {
      tier: 'Good',
      guidance: 'Good baseline progress. Focus on consolidating analytical problems and key theory topics.'
    };
  } else if (g === 'C2' || g === 'D') {
    return {
      tier: 'Needs Improvement',
      guidance: 'Consistent topic revision, formula worksheets, and faculty consultations strongly recommended.'
    };
  } else {
    return {
      tier: 'Requires Attention',
      guidance: 'Remedial coaching, fundamental review sessions, and dedicated mentor monitoring advised.'
    };
  }
}

export function analyzeStudent(student: StudentRecord, thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): StudentAnalysis {
  const isMarksOnly = student.is_marks_only ?? (student.class === '11' || student.class === '12');
  const marksEntries = Object.entries(student.marks);
  let totalMarks = 0;
  let totalMaxMarks = 0;

  marksEntries.forEach(([subj, mark]) => {
    totalMarks += Number(mark) || 0;
    const max = student.max_marks?.[subj] || (isMarksOnly ? 0 : 80);
    totalMaxMarks += Number(max) || 0;
  });

  const percentage = (!isMarksOnly && totalMaxMarks > 0)
    ? Number(((totalMarks / totalMaxMarks) * 100).toFixed(1))
    : 0;

  let tier: PerformanceTier;
  let guidance: string;
  let grade: string;

  if (isMarksOnly) {
    grade = student.grade || 'C1';
    const seniorTierInfo = getTierForSeniorGrade(grade);
    tier = seniorTierInfo.tier;
    guidance = seniorTierInfo.guidance;
  } else {
    const computed = getTierForPercentage(percentage, thresholds);
    tier = computed.tier;
    guidance = computed.guidance;
    grade = student.grade || computed.grade;
  }

  // Analyze subject level performance
  const avgMark = marksEntries.length > 0 ? totalMarks / marksEntries.length : 0;

  const subjectAnalyses: SubjectAnalysis[] = marksEntries.map(([subject, markVal]) => {
    const marks = Number(markVal) || 0;
    const maxMarks = student.max_marks?.[subject] || (isMarksOnly ? 0 : 80);
    const subjPct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    const deviation = isMarksOnly
      ? Number((marks - avgMark).toFixed(1))
      : Number((subjPct - percentage).toFixed(1));

    // A strength
    const isStrength = isMarksOnly
      ? (marks >= 45 && deviation >= 0)
      : (subjPct >= 75 && deviation >= 0);

    // Needs attention
    const needsAttention = isMarksOnly
      ? (marks < 33 || deviation <= -10)
      : (subjPct < 60 || (subjPct < 70 && deviation <= -8));

    const tip = SUBJECT_IMPROVEMENT_TIPS[subject] || DEFAULT_SUBJECT_TIP;

    return {
      subject,
      marks,
      maxMarks,
      percentage: Number(subjPct.toFixed(1)),
      isStrength,
      needsAttention,
      deviationFromAverage: deviation,
      tip
    };
  });

  // Sort by marks
  const sortedByMarks = [...subjectAnalyses].sort((a, b) => b.marks - a.marks);
  const strengths = sortedByMarks.filter(s => s.isStrength);
  const finalStrengths = strengths.length > 0 ? strengths.slice(0, 2) : sortedByMarks.slice(0, 1);

  const weak = sortedByMarks.filter(s => s.needsAttention).reverse();
  const finalWeak = weak.length > 0 ? weak.slice(0, 2) : (sortedByMarks.length > 1 ? sortedByMarks.slice(-1) : []);

  // Format natural voice spoken text in English, Hindi, and Hinglish
  const spokenText = generateSpokenScripts(student, percentage, totalMarks, grade, tier, finalStrengths, finalWeak, isMarksOnly);

  return {
    student,
    totalMarks,
    totalMaxMarks,
    percentage,
    grade,
    tier,
    tierGuidance: guidance,
    strengths: finalStrengths,
    weakSubjects: finalWeak,
    subjectAnalyses,
    isMarksOnly,
    spokenText,
  };
}

function generateSpokenScripts(
  student: StudentRecord,
  percentage: number,
  totalMarks: number,
  grade: string,
  tier: PerformanceTier,
  strengths: SubjectAnalysis[],
  weak: SubjectAnalysis[],
  isMarksOnly: boolean = false
) {
  const firstName = student.name.split(' ')[0] || student.name;
  const strengthNames = strengths.map(s => s.subject).join(' and ');

  // English narration
  let en = isMarksOnly
    ? `Hello ${firstName}! Welcome to City Central School. Your total score is ${totalMarks} marks with Grade ${grade}. `
    : `Hello ${firstName}! Welcome to City Central School. Your overall score is ${percentage} percent with Grade ${grade}. `;

  if (strengths.length > 0) {
    en += `You scored well in ${strengthNames}. `;
  }
  if (weak.length > 0) {
    const weakSubj = weak[0];
    en += `However, your marks in ${weakSubj.subject} need attention, with a score of ${weakSubj.marks} marks. Here is your improvement tip: ${weakSubj.tip} Regular practice will help you improve! `;
  } else {
    en += `All your subject marks are good and well balanced! Keep up the great consistency. `;
  }
  en += `We wish you all the very best!`;

  // Hindi narration
  const hindiStrengthNames = strengths.map(s => HINDI_SUBJECT_NAMES[s.subject] || s.subject).join(' और ');
  let hi = isMarksOnly
    ? `नमस्ते ${firstName}! सिटी सेंट्रल स्कूल में आपका स्वागत है। आपका कुल स्कोर ${totalMarks} अंक और ग्रेड ${grade} है। `
    : `नमस्ते ${firstName}! सिटी सेंट्रल स्कूल में आपका स्वागत है। आपका कुल परिणाम ${percentage} प्रतिशत और ग्रेड ${grade} है। `;

  if (strengths.length > 0) {
    hi += `आपने ${hindiStrengthNames} में बहुत अच्छे अंक प्राप्त किए हैं। `;
  }
  if (weak.length > 0) {
    const weakSubj = weak[0];
    const hindiSubjName = HINDI_SUBJECT_NAMES[weakSubj.subject] || weakSubj.subject;
    const hindiTip = HINDI_SUBJECT_IMPROVEMENT_TIPS[weakSubj.subject] || DEFAULT_HINDI_SUBJECT_TIP;
    hi += `लेकिन ${hindiSubjName} में आपका स्कोर ${weakSubj.marks} अंक है। आपके लिए सुधार का सुझाव है: ${hindiTip} नियमित अभ्यास से आपके अंक अवश्य सुधरेंगे! `;
  } else {
    hi += `आपके सभी विषयों में अंक बहुत अच्छे हैं। इसी तरह मेहनत जारी रखें! `;
  }
  hi += `आगे भी निरंतर प्रयास करते रहें!`;

  // Hinglish narration
  let hinglish = isMarksOnly
    ? `Hello ${firstName}! Aapka total score ${totalMarks} marks hai with Grade ${grade}. `
    : `Hello ${firstName}! Aapka overall score ${percentage} percent hai with Grade ${grade}. `;

  if (strengths.length > 0) {
    hinglish += `Aapne ${strengthNames} mein achhe marks score kiye hain. `;
  }
  if (weak.length > 0) {
    const weakSubj = weak[0];
    hinglish += `Lekin ${weakSubj.subject} mein aapka score ${weakSubj.marks} marks hai. Is subject ke liye tip hai: ${weakSubj.tip} Regular practice se aap bohot jaldi improve kar lenge! `;
  } else {
    hinglish += `Aapke saare subjects mein marks acche hain aur badhiya balance hai. Keep it up! `;
  }
  hinglish += `Best of luck for your studies!`;

  return { en, hi, hinglish };
}
