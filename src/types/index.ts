export type Language = 'en' | 'hi' | 'hinglish';

export interface SubjectMark {
  subject: string;
  marks: number;
  maxMarks: number;
  grade?: string;
}

export interface StudentRecord {
  student_id: string;
  name: string;
  class: string;
  section: string;
  roll_no: number;
  roll_code?: string;
  exam_name: string;
  session: string;
  attendance_percentage: number;
  marks: Record<string, number>; // e.g. { "Mathematics": 78, "Science": 84, ... }
  max_marks?: Record<string, number>; // default 80 for 6-10; omitted for 11-12
  is_marks_only?: boolean;
  grade?: string;
}

export type PerformanceTier = 'Excellent' | 'Very Good' | 'Good' | 'Needs Improvement' | 'Requires Attention';

export interface PerformanceThresholds {
  excellent: number; // default 90
  veryGood: number;  // default 75
  good: number;      // default 60
  needsImprovement: number; // default 40
}

export interface SubjectAnalysis {
  subject: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  isStrength: boolean;
  needsAttention: boolean;
  deviationFromAverage: number; // positive or negative
  tip: string;
}

export interface StudentAnalysis {
  student: StudentRecord;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  tier: PerformanceTier;
  tierGuidance: string;
  strengths: SubjectAnalysis[];
  weakSubjects: SubjectAnalysis[];
  subjectAnalyses: SubjectAnalysis[];
  isMarksOnly: boolean;
  spokenText: {
    en: string;
    hi: string;
    hinglish: string;
  };
}

export interface ValidationError {
  row: number;
  studentId?: string;
  studentName?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  classesFound: string[];
  subjectsFound: string[];
}
