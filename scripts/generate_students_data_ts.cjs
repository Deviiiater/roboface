const fs = require('fs');

const rawRecords = JSON.parse(fs.readFileSync('./src/data/realStudentRecords.json', 'utf8'));

// Function to convert name to Title Case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

const cleanedStudents = rawRecords.map(r => ({
  student_id: r.student_id,
  name: toTitleCase(r.name),
  class: r.class,
  section: r.section,
  roll_no: r.roll_no,
  roll_code: r.roll_code,
  exam_name: 'Annual Evaluation 2025-26',
  session: '2025-2026',
  attendance_percentage: r.attendance_percentage,
  marks: r.marks,
  max_marks: r.max_marks
}));

// Pick prominent demo students from this real dataset for the quick suggestions / demo chips
// For instance:
// Naman Sharma (Class 2-A, 95%)
// Raghav Singh Bhadouriya (Class 2-A, 96%)
// Divyansh Singh Tomar (Class 3-A, 96%)
// Arjun Yadav (Class 3-B, 95%)
// Utkarsh Singh Bhadouriya (Class 4-B, 99%)
// Ananya Sharma (Class 4-B, 91%)
// Aarav Sharma (Class 4-A, 91%)
// Vansh Singh (Class 5-B, 95%)
// Kartik Sharma (Class 5-B, 96%)
// Aaradhya Sharma (Class 5-C, 95%)

const fileContent = `import { StudentRecord } from '../types';

// Real school records parsed from the 7-page marks register
export const INITIAL_STUDENTS_DATA: StudentRecord[] = ${JSON.stringify(cleanedStudents, null, 2)};
`;

fs.writeFileSync('./src/data/studentsData.ts', fileContent, 'utf8');
console.log('Successfully wrote', cleanedStudents.length, 'real student records to src/data/studentsData.ts');
