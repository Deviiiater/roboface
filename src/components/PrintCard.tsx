import React from 'react';
import { StudentAnalysis } from '../types';
import { GraduationCap, Award, CheckCircle2, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

interface PrintCardProps {
  analysis: StudentAnalysis;
  onClose: () => void;
}

export const PrintCard: React.FC<PrintCardProps> = ({ analysis, onClose }) => {
  const { student, percentage, grade, tier, tierGuidance, strengths, weakSubjects, subjectAnalyses } = analysis;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none">
        {/* Screen Controls Header - Hidden when printing */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm">Official PTM Result Card Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Card Content */}
        <div className="p-8 sm:p-10 font-sans">
          {/* School Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              <GraduationCap className="w-4 h-4 text-blue-700" />
              Affiliated to CBSE, New Delhi • School Code: 20491
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              CITY CENTRAL SENIOR SECONDARY SCHOOL
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Institutional Area, New Delhi • Parent-Teacher Meeting Evaluation
            </p>
            <div className="inline-block mt-3 px-4 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider">
              {student.exam_name} • Academic Session {student.session}
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 bg-slate-50/50 rounded-2xl px-6 my-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Student Name</span>
              <p className="text-base font-extrabold text-slate-900">{student.name}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Class & Section</span>
              <p className="text-base font-extrabold text-slate-900">Class {student.class} - {student.section}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Roll Number</span>
              <p className="text-base font-extrabold text-slate-900">#{student.roll_code || student.roll_no}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Student ID / Attendance</span>
              <p className="text-base font-extrabold text-slate-900 font-mono text-sm">{student.student_id} ({student.attendance_percentage}%)</p>
            </div>
          </div>

          {/* Overall Score Summary Highlights */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-xs font-bold text-blue-700 uppercase">Overall Percentage</span>
              <div className="text-3xl font-black text-blue-900 mt-1">{percentage}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
              <span className="text-xs font-bold text-indigo-700 uppercase">Total Marks</span>
              <div className="text-3xl font-black text-indigo-900 mt-1">
                {analysis.totalMarks} / {analysis.totalMaxMarks}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-xs font-bold text-emerald-700 uppercase">Grade & Standing</span>
              <div className="text-2xl font-black text-emerald-900 mt-1 flex items-center justify-center gap-1">
                <span>{grade}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  {tier}
                </span>
              </div>
            </div>
          </div>

          {/* Subject-Wise Marks Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Subject-Wise Verified Marks Breakdown
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-4 text-center">Maximum Marks</th>
                    <th className="py-2.5 px-4 text-center">Percentage</th>
                    <th className="py-2.5 px-4">Performance Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {subjectAnalyses.map(subj => (
                    <tr key={subj.subject} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{subj.subject}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">{subj.marks}</td>
                      <td className="py-2.5 px-4 text-center text-slate-500">{subj.maxMarks}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800">{subj.percentage}%</td>
                      <td className="py-2.5 px-4">
                        {subj.isStrength ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> High Strength
                          </span>
                        ) : subj.needsAttention ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">Good Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Improvement Tips */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              Teacher Guidance & Next Steps for Home Revision
            </h4>
            <p className="text-xs text-slate-700 mb-2 font-medium">{tierGuidance}</p>
            {weakSubjects.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {weakSubjects.map(ws => (
                  <div key={ws.subject} className="text-xs text-slate-800 flex items-start gap-1.5">
                    <span className="font-bold text-amber-800 shrink-0">• {ws.subject} ({ws.marks}/100):</span>
                    <span>{ws.tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-center text-xs text-slate-500">
            <div>
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span>Class Teacher Signature</span>
            </div>
            <div>
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span>Parent / Guardian Signature</span>
            </div>
            <div>
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span>Principal / Head of School</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
