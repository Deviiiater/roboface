const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleRows = [
  {
    student_id: 'CCS-2026-9B-01',
    name: 'Rahul Sharma',
    class: '9',
    section: 'B',
    roll_no: 14,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 92,
    Mathematics: 71,
    Science: 82,
    English: 86,
    Hindi: 79,
    'Social Science': 54,
    Computer: 91
  },
  {
    student_id: 'CCS-2026-10A-01',
    name: 'Ananya Verma',
    class: '10',
    section: 'A',
    roll_no: 3,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 98,
    Mathematics: 96,
    Science: 94,
    English: 92,
    Hindi: 90,
    'Social Science': 95,
    Computer: 99
  },
  {
    student_id: 'CCS-2026-8A-02',
    name: 'Vihaan Gupta',
    class: '8',
    section: 'A',
    roll_no: 19,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 84,
    Mathematics: 48,
    Science: 52,
    English: 64,
    Hindi: 60,
    'Social Science': 42,
    Computer: 70
  },
  {
    student_id: 'CCS-2026-7C-03',
    name: 'Diya Patel',
    class: '7',
    section: 'C',
    roll_no: 7,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 91,
    Mathematics: 88,
    Science: 84,
    English: 89,
    Hindi: 82,
    'Social Science': 78,
    Computer: 95
  },
  {
    student_id: 'CCS-2026-11A-04',
    name: 'Kabir Singh',
    class: '11',
    section: 'A',
    roll_no: 12,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 76,
    Physics: 58,
    Chemistry: 62,
    Mathematics: 38,
    English: 74,
    'Computer Science': 80
  },
  {
    student_id: 'CCS-2026-12B-05',
    name: 'Priya Mehta',
    class: '12',
    section: 'B',
    roll_no: 22,
    exam_name: 'Annual Term Evaluation',
    session: '2025-2026',
    attendance: 95,
    Accountancy: 91,
    'Business Studies': 88,
    Economics: 86,
    English: 89,
    Mathematics: 79
  }
];

// Write Excel (.xlsx)
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleRows);
XLSX.utils.book_append_sheet(wb, ws, 'PTM_Results_2026');
const excelFilePath = path.join(__dirname, '..', 'sample_school_ptm_results.xlsx');
XLSX.writeFile(wb, excelFilePath);

// Write CSV
const csvFilePath = path.join(__dirname, '..', 'sample_school_ptm_results.csv');
const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync(csvFilePath, csvContent, 'utf-8');

console.log('Generated sample Excel and CSV successfully:');
console.log(' - ' + excelFilePath);
console.log(' - ' + csvFilePath);
