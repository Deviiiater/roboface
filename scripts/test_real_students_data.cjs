const fs = require('fs');
const path = require('path');

const students = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/realStudentRecords.json'), 'utf8'));

console.log(`Total real students loaded: ${students.length}`);

// Check class distribution
const classCount = {};
students.forEach(s => {
  const key = `Class ${s.class}-${s.section}`;
  classCount[key] = (classCount[key] || 0) + 1;
});
console.log('Class Distribution:', classCount);

// Test sample students
const sampleNames = ['Naman Sharma', 'Utkarsh Singh Bhadouriya', 'Kartik Sharma', 'Anshika Vimal'];
sampleNames.forEach(name => {
  const match = students.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (match) {
    const totalMarks = Object.values(match.marks).reduce((a, b) => a + b, 0);
    const totalMax = Object.values(match.max_marks).reduce((a, b) => a + b, 0);
    const pct = ((totalMarks / totalMax) * 100).toFixed(1);
    console.log(`\nVerified Student: ${match.name}`);
    console.log(`- Roll: #${match.roll_code || match.roll_no} | Class: ${match.class}-${match.section}`);
    console.log(`- Marks:`, match.marks);
    console.log(`- Total: ${totalMarks}/${totalMax} (${pct}%)`);
  } else {
    console.error(`Missing student: ${name}`);
  }
});
