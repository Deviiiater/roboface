import * as XLSX from 'xlsx';
import { StudentRecord, ValidationError, ValidationSummary } from '../types';

export function parseAndValidateStudentData(fileData: ArrayBuffer | string): {
  students: StudentRecord[];
  summary: ValidationSummary;
} {
  const workbook = XLSX.read(fileData, { type: typeof fileData === 'string' ? 'string' : 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const students: StudentRecord[] = [];

  const seenStudentIds = new Set<string>();
  const seenNameClassSec = new Set<string>();
  const classesFound = new Set<string>();
  const subjectsFound = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-based, row 1 is header

    // Normalize keys: trim and lowercase helper
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach(k => {
      normalizedRow[k.trim().toLowerCase()] = row[k];
    });

    const studentId = String(normalizedRow['student_id'] || normalizedRow['studentid'] || normalizedRow['id'] || '').trim();
    const name = String(normalizedRow['name'] || normalizedRow['student_name'] || normalizedRow['student name'] || '').trim();
    const studentClass = String(normalizedRow['class'] || normalizedRow['grade'] || normalizedRow['standard'] || '').trim();
    const section = String(normalizedRow['section'] || normalizedRow['sec'] || '').trim().toUpperCase();
    const rawRoll = String(normalizedRow['roll no'] || normalizedRow['roll_no'] || normalizedRow['rollno'] || normalizedRow['roll'] || '').trim();
    const rollNo = parseInt(rawRoll.split('/')[0] || '0', 10);
    const rollCode = rawRoll.includes('/') ? rawRoll : undefined;
    const examName = String(normalizedRow['exam_name'] || normalizedRow['exam'] || 'Annual Term Evaluation').trim();
    const session = String(normalizedRow['session'] || normalizedRow['academic_session'] || '2025-2026').trim();
    const attendance = parseFloat(String(normalizedRow['attendance'] || normalizedRow['attendance_percentage'] || '90')) || 90;

    let hasFatalError = false;

    // 1. Missing mandatory fields
    if (!name) {
      errors.push({ row: rowNum, studentId, field: 'name', message: 'Student Name is required and cannot be blank.', severity: 'error' });
      hasFatalError = true;
    }
    if (!studentClass) {
      errors.push({ row: rowNum, studentId, studentName: name, field: 'class', message: 'Class is required.', severity: 'error' });
      hasFatalError = true;
    }
    if (!section) {
      errors.push({ row: rowNum, studentId, studentName: name, field: 'section', message: 'Section is required.', severity: 'error' });
      hasFatalError = true;
    }

    // 2. Duplicate Student IDs
    if (studentId) {
      if (seenStudentIds.has(studentId)) {
        errors.push({ row: rowNum, studentId, studentName: name, field: 'student_id', message: `Duplicate Student ID "${studentId}" detected.`, severity: 'error' });
        hasFatalError = true;
      } else {
        seenStudentIds.add(studentId);
      }
    }

    // 3. Duplicate Name + Class + Section
    if (name && studentClass && section) {
      const key = `${name.toLowerCase()}__${studentClass}__${section}`;
      if (seenNameClassSec.has(key)) {
        warnings.push({ row: rowNum, studentId, studentName: name, field: 'name', message: `Multiple students with name "${name}" in Class ${studentClass}-${section}. Internal roll no/ID will be used for disambiguation.`, severity: 'warning' });
      } else {
        seenNameClassSec.add(key);
      }
      classesFound.add(studentClass);
    }

    // 4. Extract subject marks
    const reservedKeys = new Set([
      'student_id', 'studentid', 'id',
      'name', 'student_name', 'student name',
      'class', 'grade', 'standard',
      'section', 'sec',
      'roll_no', 'rollno', 'roll', 'roll no', 'roll number',
      'exam_name', 'exam',
      'session', 'academic_session',
      'attendance', 'attendance_percentage',
      'total marks', 'total_marks', 'total',
      'max marks', 'max_marks', 'max',
      'percentage', 'percentage%', 'grade'
    ]);

    const marks: Record<string, number> = {};
    const maxMarks: Record<string, number> = {};

    Object.keys(row).forEach(rawKey => {
      const trimmed = rawKey.trim();
      const lower = trimmed.toLowerCase();
      if (!reservedKeys.has(lower) && !lower.startsWith('max_') && !lower.endsWith('_max')) {
        const val = row[rawKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const strVal = String(val).trim();
          if (strVal.toUpperCase() === 'AB' || strVal.toUpperCase() === 'ABSENT') {
            marks[trimmed] = 0;
            maxMarks[trimmed] = 80;
            subjectsFound.add(trimmed);
          } else {
            const num = Number(val);
            if (isNaN(num)) {
              errors.push({ row: rowNum, studentId, studentName: name, field: trimmed, message: `Invalid mark "${val}" for subject "${trimmed}". Expected a number or AB.`, severity: 'error' });
              hasFatalError = true;
            } else if (num < 0 || num > 100) {
              errors.push({ row: rowNum, studentId, studentName: name, field: trimmed, message: `Mark ${num} for "${trimmed}" is out of allowable range (0–100).`, severity: 'error' });
              hasFatalError = true;
            } else {
              marks[trimmed] = num;
              maxMarks[trimmed] = 80;
              subjectsFound.add(trimmed);
            }
          }
        }
      }
    });

    if (Object.keys(marks).length === 0 && !hasFatalError) {
      errors.push({ row: rowNum, studentId, studentName: name, field: 'marks', message: 'No subject marks found for student.', severity: 'error' });
      hasFatalError = true;
    }

    if (!hasFatalError) {
      students.push({
        student_id: studentId || (rollCode ? `CCS-${rollCode.replace('/', '-')}` : `GEN-${Date.now()}-${idx + 1}`),
        name,
        class: studentClass,
        section,
        roll_no: rollNo || idx + 1,
        roll_code: rollCode,
        exam_name: examName,
        session: session,
        attendance_percentage: attendance,
        marks,
        max_marks: maxMarks
      });
    }
  });

  return {
    students,
    summary: {
      totalRows: rawRows.length,
      validRows: students.length,
      errors,
      warnings,
      classesFound: Array.from(classesFound).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
      subjectsFound: Array.from(subjectsFound)
    }
  };
}

export function generateSampleExcelBlob(): Blob {
  const sampleData = [
    {
      student_id: 'CCS-2026-9B-01',
      name: 'Rahul Sharma',
      class: '9',
      section: 'B',
      roll_no: 14,
      attendance: 92,
      Mathematics: 71,
      Science: 82,
      English: 86,
      Hindi: 79,
      'Social Science': 54,
      Computer: 91,
    },
    {
      student_id: 'CCS-2026-10A-01',
      name: 'Ananya Verma',
      class: '10',
      section: 'A',
      roll_no: 3,
      attendance: 98,
      Mathematics: 96,
      Science: 94,
      English: 92,
      Hindi: 90,
      'Social Science': 95,
      Computer: 99,
    },
    {
      student_id: 'CCS-2026-8A-02',
      name: 'Vihaan Gupta',
      class: '8',
      section: 'A',
      roll_no: 19,
      attendance: 84,
      Mathematics: 48,
      Science: 52,
      English: 64,
      Hindi: 60,
      'Social Science': 42,
      Computer: 70,
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PTM_Results');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
