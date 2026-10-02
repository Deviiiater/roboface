import React, { useState, useRef } from 'react';
import { StudentRecord, ValidationSummary, PerformanceThresholds } from '../types';
import { parseAndValidateStudentData, generateSampleExcelBlob } from '../services/dataValidator';
import { sounds } from '../services/soundEffects';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings2,
  Database,
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface AdminModalProps {
  students: StudentRecord[];
  thresholds: PerformanceThresholds;
  inactivityTimeout: number;
  onUpdateStudents: (newStudents: StudentRecord[]) => void;
  onUpdateThresholds: (thresholds: PerformanceThresholds) => void;
  onUpdateInactivityTimeout: (seconds: number) => void;
  onResetToDefaultData: () => void;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  students,
  thresholds,
  inactivityTimeout,
  onUpdateStudents,
  onUpdateThresholds,
  onUpdateInactivityTimeout,
  onResetToDefaultData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'rules' | 'dataset' | 'supabase'>('import');
  const [importSummary, setImportSummary] = useState<ValidationSummary | null>(null);
  const [pendingStudents, setPendingStudents] = useState<StudentRecord[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Rules state
  const [localThresholds, setLocalThresholds] = useState<PerformanceThresholds>(thresholds);
  const [localTimeout, setLocalTimeout] = useState<number>(inactivityTimeout);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Excel / CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playClick();
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseAndValidateStudentData(buffer);
        setImportSummary(result.summary);
        setPendingStudents(result.students);
      } catch (err: any) {
        alert('Failed to parse file: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyImportedData = () => {
    if (pendingStudents && pendingStudents.length > 0) {
      sounds.playCelebration();
      onUpdateStudents(pendingStudents);
      alert(`Success! Loaded ${pendingStudents.length} student records into the PTM Kiosk.`);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    sounds.playClick();
    const blob = generateSampleExcelBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'School_PTM_Sample_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    onUpdateThresholds(localThresholds);
    onUpdateInactivityTimeout(localTimeout);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-black border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Teacher Admin & PTM Configuration</h3>
              <p className="text-xs text-slate-400">Manage Excel imports, validation rules, and kiosk timers</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('import');
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV Import</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('rules');
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Thresholds & Timer</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('dataset');
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'dataset'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dataset ({students.length} Records)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('supabase');
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'supabase'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Upgrade</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-200">
          {/* TAB 1: EXCEL / CSV IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    School Excel / CSV Importer
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drag and drop your school result spreadsheet. Validates duplicates, missing fields, and marks range.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/student_records_result.xlsx"
                    download="student_records_result.xlsx"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold border border-emerald-500/40 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download School Excel (444 Students)</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Blank Template</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition-all flex flex-col items-center justify-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-white">
                  Click to Browse or Drop Excel (.xlsx, .xls) / CSV File Here
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Expected columns: student_id, name, class, section, roll_no, subject marks...
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>

              {/* Validation Summary Report */}
              {importSummary && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                      <span>Import Validation Summary: {fileName}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">
                        {importSummary.validRows} valid of {importSummary.totalRows} rows
                      </span>
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total Rows</span>
                        <div className="text-xl font-bold text-white mt-0.5">{importSummary.totalRows}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-emerald-500">Valid Students</span>
                        <div className="text-xl font-bold text-emerald-400 mt-0.5">{importSummary.validRows}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-rose-500">Errors</span>
                        <div className="text-xl font-bold text-rose-400 mt-0.5">{importSummary.errors.length}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-amber-500">Warnings</span>
                        <div className="text-xl font-bold text-amber-400 mt-0.5">{importSummary.warnings.length}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>Detected Classes: <strong className="text-white">{importSummary.classesFound.join(', ') || 'None'}</strong></span>
                      <span>•</span>
                      <span>Subjects: <strong className="text-white">{importSummary.subjectsFound.join(', ') || 'None'}</strong></span>
                    </div>
                  </div>

                  {/* List of Errors if any */}
                  {importSummary.errors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 max-h-40 overflow-y-auto space-y-1.5 text-xs text-rose-300">
                      <div className="font-bold flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Validation Errors (These rows cannot be imported):</span>
                      </div>
                      {importSummary.errors.map((err, i) => (
                        <div key={i} className="pl-5 relative">
                          <span className="font-mono font-bold">Row {err.row}:</span> {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List of Warnings if any */}
                  {importSummary.warnings.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 max-h-36 overflow-y-auto space-y-1.5 text-xs text-amber-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Warnings (Ambiguities / Disambiguation used):</span>
                      </div>
                      {importSummary.warnings.map((warn, i) => (
                        <div key={i} className="pl-5 relative">
                          <span className="font-mono font-bold">Row {warn.row}:</span> {warn.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Apply Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!pendingStudents || pendingStudents.length === 0}
                      onClick={handleApplyImportedData}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      Apply & Load {pendingStudents?.length || 0} Students to Kiosk
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THRESHOLDS & TIMER CONFIG */}
          {activeTab === 'rules' && (
            <form onSubmit={handleSaveRules} className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Configurable Performance Thresholds
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set cutoffs for school grade tiers. The robot dynamically evaluates performance based on these percentages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Excellent Tier (Current: {localThresholds.excellent}% – 100%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={localThresholds.excellent}
                    onChange={e => setLocalThresholds({ ...localThresholds, excellent: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Guidance: "Continue current study habits and challenge yourself."
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    Very Good Tier (Current: {localThresholds.veryGood}% – {localThresholds.excellent - 1}%)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="95"
                    value={localThresholds.veryGood}
                    onChange={e => setLocalThresholds({ ...localThresholds, veryGood: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Guidance: "Maintain consistency and strengthen difficult topics."
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    Good Tier (Current: {localThresholds.good}% – {localThresholds.veryGood - 1}%)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="85"
                    value={localThresholds.good}
                    onChange={e => setLocalThresholds({ ...localThresholds, good: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Guidance: "Increase practice and revision in weaker topics."
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Needs Improvement Cutoff (Current: {localThresholds.needsImprovement}% – {localThresholds.good - 1}%)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={localThresholds.needsImprovement}
                    onChange={e => setLocalThresholds({ ...localThresholds, needsImprovement: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Below this threshold triggers "Requires Attention" and focused parental support.
                  </p>
                </div>
              </div>

              {/* Inactivity Reset Timeout */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Kiosk Inactivity Auto-Reset Countdown (Seconds)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="20"
                    max="180"
                    step="10"
                    value={localTimeout}
                    onChange={e => setLocalTimeout(Number(e.target.value))}
                    className="flex-1 accent-cyan-500"
                  />
                  <span className="text-base font-mono font-bold text-cyan-400 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 min-w-16 text-center">
                    {localTimeout}s
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Kiosk automatically returns to Home screen after this idle duration so student privacy is preserved.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-xs text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ACTIVE DATASET & RESET */}
          {activeTab === 'dataset' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Currently Loaded Dataset
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {students.length} student records loaded in kiosk memory.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to original bundled 520 student records?')) {
                      sounds.playClick();
                      onResetToDefaultData();
                      alert('Reset to default 520 student records completed.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Default 520 Records</span>
                </button>
              </div>

              {/* Sample list preview */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-[42vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Class-Sec</th>
                      <th className="py-2.5 px-3">Roll</th>
                      <th className="py-2.5 px-3">Subjects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {students.slice(0, 50).map(s => (
                      <tr key={s.student_id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-cyan-400">{s.student_id}</td>
                        <td className="py-2 px-3 font-sans font-bold text-white">{s.name}</td>
                        <td className="py-2 px-3">{s.class}-{s.section}</td>
                        <td className="py-2 px-3">{s.roll_no}</td>
                        <td className="py-2 px-3 font-sans text-slate-400">
                          {Object.keys(s.marks).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Showing first 50 of {students.length} student records.
              </p>
            </div>
          )}

          {/* TAB 4: SUPABASE PRODUCTION UPGRADE */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Production Upgrade: Supabase PostgreSQL Architecture
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  For multiple tablets, live teacher updates without redeploying, and persistent cloud storage.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase">
                  Ready-to-Run PostgreSQL Schema for Supabase:
                </span>
                <pre className="p-3 bg-slate-900 rounded-xl text-[11px] text-cyan-300 font-mono overflow-x-auto border border-slate-800">
{`CREATE TABLE students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  roll_no INT,
  exam_name TEXT DEFAULT 'Annual Term Evaluation',
  session TEXT DEFAULT '2025-2026',
  attendance_percentage NUMERIC DEFAULT 90,
  marks JSONB NOT NULL,
  max_marks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read for PTM tablet kiosk
CREATE POLICY "Allow public read for kiosk" ON students
  FOR SELECT USING (true);`}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Supabase Project URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Supabase Anon Public Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
