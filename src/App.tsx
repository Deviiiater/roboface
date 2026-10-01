import React, { useState, useEffect } from 'react';
import { StudentRecord, StudentAnalysis, Language, PerformanceThresholds } from './types';
import { INITIAL_STUDENTS_DATA } from './data/studentsData';
import { DEFAULT_THRESHOLDS, analyzeStudent } from './services/analysisEngine';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminModal } from './components/AdminModal';

type AppScreen = 'home' | 'search' | 'result';

export function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const DATASET_VERSION = 'v2_real_school_records_444';
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const savedVersion = localStorage.getItem('ptm_students_version');
      if (savedVersion === DATASET_VERSION) {
        const saved = localStorage.getItem('ptm_students_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } else {
        localStorage.setItem('ptm_students_version', DATASET_VERSION);
        localStorage.setItem('ptm_students_data', JSON.stringify(INITIAL_STUDENTS_DATA));
      }
    } catch {
      // fallback
    }
    return INITIAL_STUDENTS_DATA;
  });

  const [thresholds, setThresholds] = useState<PerformanceThresholds>(() => {
    try {
      const saved = localStorage.getItem('ptm_thresholds');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_THRESHOLDS;
  });

  const [inactivityTimeout, setInactivityTimeout] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ptm_inactivity_timeout');
      if (saved) return Number(saved);
    } catch {
      // fallback
    }
    return 60;
  });

  const [language, setLanguage] = useState<Language>('en');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<StudentAnalysis | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Search pre-fill states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClass, setSearchClass] = useState('all');

  // Save to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('ptm_thresholds', JSON.stringify(thresholds));
    } catch {
      // ignore
    }
  }, [thresholds]);

  useEffect(() => {
    try {
      localStorage.setItem('ptm_inactivity_timeout', String(inactivityTimeout));
    } catch {
      // ignore
    }
  }, [inactivityTimeout]);

  const handleUpdateStudents = (newStudents: StudentRecord[]) => {
    setStudents(newStudents);
    try {
      localStorage.setItem('ptm_students_data', JSON.stringify(newStudents));
    } catch {
      // ignore
    }
  };

  const handleResetToDefaultData = () => {
    setStudents(INITIAL_STUDENTS_DATA);
    try {
      localStorage.removeItem('ptm_students_data');
    } catch {
      // ignore
    }
  };

  const handleStart = () => {
    setSearchQuery('');
    setSearchClass('all');
    setScreen('search');
  };

  const handleQuickSelectStudent = (studentName: string, studentClass: string) => {
    setSearchQuery(studentName);
    setSearchClass(studentClass);
    setScreen('search');
  };

  const handleSelectStudent = (student: StudentRecord) => {
    setSelectedStudent(student);
    const analysis = analyzeStudent(student, thresholds);
    setCurrentAnalysis(analysis);
    setScreen('result');
  };

  const handleResetKiosk = () => {
    setSelectedStudent(null);
    setCurrentAnalysis(null);
    setSearchQuery('');
    setSearchClass('all');
    setScreen('home');
  };

  const handleBackToSearch = () => {
    setScreen('search');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500 selection:text-white">
      {screen === 'home' && (
        <HomeScreen
          language={language}
          onSelectLanguage={setLanguage}
          onStart={handleStart}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onQuickSelectStudent={handleQuickSelectStudent}
        />
      )}

      {screen === 'search' && (
        <SearchScreen
          students={students}
          language={language}
          onSelectLanguage={setLanguage}
          initialQuery={searchQuery}
          onSelectStudent={handleSelectStudent}
          onBack={handleResetKiosk}
        />
      )}

      {screen === 'result' && currentAnalysis && (
        <ResultScreen
          analysis={currentAnalysis}
          language={language}
          onLanguageChange={setLanguage}
          onReset={handleResetKiosk}
          onBackToSearch={handleBackToSearch}
          inactivityTimeoutSeconds={inactivityTimeout}
        />
      )}

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <AdminModal
          students={students}
          thresholds={thresholds}
          inactivityTimeout={inactivityTimeout}
          onUpdateStudents={handleUpdateStudents}
          onUpdateThresholds={setThresholds}
          onUpdateInactivityTimeout={setInactivityTimeout}
          onResetToDefaultData={handleResetToDefaultData}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
