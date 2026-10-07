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
  const DATASET_VERSION = 'v7_classes_6_to_12_all_students';
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const savedVersion = localStorage.getItem('ptm_students_version');
      if (savedVersion === DATASET_VERSION) {
        const saved = localStorage.getItem('ptm_students_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } else {
        localStorage.setItem('ptm_students_version', DATASET_VERSION);
        localStorage.removeItem('ptm_students_data');
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

  // Screen rotation state (0, 90, 180, 270 degrees) for physical tablet robot mounting
  const [rotation, setRotation] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ptm_screen_rotation');
      if (saved) return Number(saved) % 360;
    } catch {
      // ignore
    }
    return 0;
  });

  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    try {
      localStorage.setItem('ptm_screen_rotation', String(nextRotation));
    } catch {
      // ignore
    }
  };

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

  const getRotationStyle = (): React.CSSProperties => {
    if (rotation === 90) {
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#000000',
      };
    }
    if (rotation === 180) {
      return {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        transform: 'rotate(180deg)',
        transformOrigin: 'center center',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#000000',
      };
    }
    if (rotation === 270) {
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(270deg)',
        transformOrigin: 'center center',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#000000',
      };
    }
    return {
      backgroundColor: '#000000',
      minHeight: '100vh',
      width: '100%',
    };
  };

  return (
    <div
      style={getRotationStyle()}
      className="min-h-screen w-full bg-black font-sans text-white selection:bg-cyan-500 selection:text-white"
    >
      {screen === 'home' && (
        <HomeScreen
          language={language}
          onSelectLanguage={setLanguage}
          onStart={handleStart}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onQuickSelectStudent={handleQuickSelectStudent}
          onRotate={handleRotate}
          rotation={rotation}
          studentsCount={students.length}
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
          onRotate={handleRotate}
          rotation={rotation}
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
          onRotate={handleRotate}
          rotation={rotation}
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
