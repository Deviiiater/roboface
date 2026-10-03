const { INITIAL_STUDENTS_DATA } = require('../src/data/studentsData.ts');

console.log('Validating', INITIAL_STUDENTS_DATA.length, 'records...');

let mismatchCount = 0;
const classCounts = {};

for (const student of INITIAL_STUDENTS_DATA) {
  const key = `Class ${student.class}-${student.section}`;
  classCounts[key] = (classCounts[key] || 0) + 1;

  const total = Object.values(student.marks).reduce((a, b) => a + b, 0);
  const subjects = Object.keys(student.marks);
  if (subjects.length !== 6) {
    console.error('Expected 6 subjects, got', subjects, 'for', student.name);
    mismatchCount++;
  }
}

console.log('Breakdown by Class & Section:');
console.table(classCounts);
console.log('Total verified records:', INITIAL_STUDENTS_DATA.length);
console.log('Mismatches:', mismatchCount);
