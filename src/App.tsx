import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, BookOpen, Download, RotateCcw, Plus, Trash2, ChevronDown, BarChart3, Target, AlertTriangle, TrendingUp, PieChart as PieChartIcon, Zap, Sliders, Award, ShieldAlert, GraduationCap, Briefcase } from 'lucide-react';
import { Faculty, Subject, SubjectMarks, SemesterResult } from './types';
import { SUBJECT_DATABASE } from './data/subjects';
import { calculateSubjectGPA, getDivision, generateInsights, simulateTargetGPA } from './lib/calculations';
import GoogleAd from './components/GoogleAd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, 
  ScatterChart, Scatter, ZAxis,
  LabelList
} from 'recharts';

const EMPTY_ARRAY: any[] = [];

const SubjectRow = memo(({ 
  subject, 
  marks, 
  onChange 
}: { 
  subject: Subject; 
  marks: SubjectMarks; 
  onChange: (id: string, field: keyof SubjectMarks, value: string, max: number) => void 
}) => {
  const res = calculateSubjectGPA(
    marks.theory, subject.theoryFull,
    marks.internal, subject.internalFull,
    marks.practical, subject.practicalFull
  );

  return (
    <tr className="hover:bg-[--color-apple-bg]/50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-semibold">{subject.name}</p>
        {res.isCapped && <span className="text-[9px] text-black/40 font-bold uppercase tracking-tighter block mt-0.5">Capped by 20% rule</span>}
      </td>
      <td className="px-4 py-4 text-center text-sm font-medium text-[--color-apple-gray]">{subject.credits}</td>
      <td className="px-4 py-4">
        {subject.theoryFull > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              placeholder="—"
              value={marks.theory === null || isNaN(marks.theory) ? '' : marks.theory}
              onChange={(e) => onChange(subject.id, 'theory', e.target.value, subject.theoryFull)}
              className={`apple-input w-16 text-center h-8 ${marks.theory !== null && marks.theory < subject.theoryFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
            />
            <span className="text-[10px] text-[--color-apple-gray]">/ {subject.theoryFull}</span>
          </div>
        ) : <span className="text-[--color-apple-gray] block text-center">—</span>}
      </td>
      <td className="px-4 py-4">
        {subject.internalFull > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              placeholder="—"
              value={marks.internal === null || isNaN(marks.internal) ? '' : marks.internal}
              onChange={(e) => onChange(subject.id, 'internal', e.target.value, subject.internalFull)}
              className={`apple-input w-16 text-center h-8 ${marks.internal !== null && marks.internal < subject.internalFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
            />
            <span className="text-[10px] text-[--color-apple-gray]">/ {subject.internalFull}</span>
          </div>
        ) : <span className="text-[--color-apple-gray] block text-center">—</span>}
      </td>
      <td className="px-4 py-4">
        {subject.practicalFull > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              placeholder="—"
              value={marks.practical === null || isNaN(marks.practical) ? '' : marks.practical}
              onChange={(e) => onChange(subject.id, 'practical', e.target.value, subject.practicalFull)}
              className={`apple-input w-16 text-center h-8 ${marks.practical !== null && marks.practical < subject.practicalFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
            />
            <span className="text-[10px] text-[--color-apple-gray]">/ {subject.practicalFull}</span>
          </div>
        ) : <span className="text-[--color-apple-gray] block text-center">—</span>}
      </td>
      <td className="px-4 py-4 text-center">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
          res.grade.letter === 'F' ? 'bg-red-50 text-red-600' : 'bg-black text-white'
        }`}>
          {res.grade.letter}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-sm font-bold">
        {(res.grade.gp * subject.credits).toFixed(2)}
      </td>
    </tr>
  );
});

export default function App() {
  const [mode, setMode] = useState<'semester' | 'aggregate' | 'stats' | 'simulator'>('semester');
  const [faculty, setFaculty] = useState<Faculty | ''>(() => (localStorage.getItem('ioe_faculty') as Faculty) || '');
  const [semester, setSemester] = useState<number | ''>(() => {
    const saved = localStorage.getItem('ioe_semester');
    return saved ? parseInt(saved) : '';
  });
  const [marks, setMarks] = useState<Record<string, SubjectMarks>>(() => {
    const saved = localStorage.getItem('ioe_marks');
    return saved ? JSON.parse(saved) : {};
  });
  const [aggregateSems, setAggregateSems] = useState<SemesterResult[]>(() => {
    const saved = localStorage.getItem('ioe_aggregate');
    return saved ? JSON.parse(saved) : [{ id: '1', gpa: 0, credits: 0 }];
  });

  const [targetGPA, setTargetGPA] = useState(3.6);
  const [gradGoal, setGradGoal] = useState(3.75);
  const [whatIfMarks, setWhatIfMarks] = useState<Record<string, number>>({});

  // Persistence effects (debounced for marks)
  useEffect(() => {
    if (faculty) localStorage.setItem('ioe_faculty', faculty);
    if (semester) localStorage.setItem('ioe_semester', semester.toString());
  }, [faculty, semester]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('ioe_marks', JSON.stringify(marks));
    }, 500);
    return () => clearTimeout(timer);
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('ioe_aggregate', JSON.stringify(aggregateSems));
  }, [aggregateSems]);

  // Load subjects when faculty/semester changes
  const subjects = useMemo(() => {
    if (faculty && semester) {
      return SUBJECT_DATABASE[faculty][semester as number] || EMPTY_ARRAY;
    }
    return EMPTY_ARRAY;
  }, [faculty, semester]);

  // Initialize marks when subjects change (without overwriting existing marks)
  useEffect(() => {
    if (subjects.length === 0) return;
    
    setMarks(prev => {
      const needsInit = subjects.some(s => !prev[s.id]);
      if (!needsInit) return prev;
      
      const newMarks = { ...prev };
      subjects.forEach(s => {
        if (!newMarks[s.id]) {
          newMarks[s.id] = { theory: null, internal: null, practical: null };
        }
      });
      return newMarks;
    });
  }, [subjects]);

  const handleMarkChange = (subjectId: string, field: keyof SubjectMarks, value: string, max: number) => {
    if (value === '') {
      setMarks(prev => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], [field]: null }
      }));
      return;
    }

    let numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Clamp values between 0 and max
    numValue = Math.max(0, Math.min(max, numValue));

    setMarks(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], [field]: numValue }
    }));
  };

  const semesterStats = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    let totalObtained = 0;
    let totalFull = 0;

    subjects.forEach(s => {
      const m = marks[s.id] || { theory: null, internal: null, practical: null };
      const res = calculateSubjectGPA(
        m.theory, s.theoryFull,
        m.internal, s.internalFull,
        m.practical, s.practicalFull
      );
      
      totalCredits += s.credits;
      totalGradePoints += res.grade.gp * s.credits;
      totalObtained += res.totalObtained;
      totalFull += res.totalFull;
    });

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    return { gpa, totalCredits, totalGradePoints, totalObtained, totalFull };
  }, [subjects, marks]);

  const aggregateStats = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;
    aggregateSems.forEach(s => {
      totalCredits += s.credits;
      totalPoints += s.gpa * s.credits;
    });
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return { cgpa, totalCredits, totalPoints };
  }, [aggregateSems]);

  const insights = useMemo(() => {
    if (subjects.length === 0 || mode !== 'stats') return null;
    return generateInsights(subjects, marks);
  }, [subjects, marks, mode]);

  const simulatedMarks = useMemo(() => {
    if (subjects.length === 0 || mode !== 'simulator') return null;
    return simulateTargetGPA(subjects, targetGPA);
  }, [subjects, targetGPA, mode]);

  const chartData = useMemo(() => {
    if (mode !== 'stats') return [];
    return subjects.map(s => {
      const m = marks[s.id] || { theory: null, internal: null, practical: null };
      const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      const whatIfTheory = whatIfMarks[s.id] ?? (m.theory || 0);
      const whatIfRes = calculateSubjectGPA(whatIfTheory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      
      return {
        name: s.name.split(' ').map(w => w[0]).join(''),
        fullName: s.name,
        theory: m.theory || 0,
        internal: res.effectiveInternal,
        practical: m.practical || 0,
        full: s.theoryFull + s.internalFull + s.practicalFull,
        isCapped: res.isCapped,
        whatIfGPA: whatIfRes.grade.gp,
        percentage: res.percentage,
        credits: s.credits
      };
    });
  }, [subjects, marks, mode, whatIfMarks]);

  const whatIfGPA = useMemo(() => {
    if (subjects.length === 0) return 0;
    const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
    const totalPoints = subjects.reduce((acc, s) => {
      const m = marks[s.id] || { theory: null, internal: null, practical: null };
      const theory = whatIfMarks[s.id] ?? (m.theory || 0);
      const res = calculateSubjectGPA(theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      return acc + res.grade.gp * s.credits;
    }, 0);
    return totalPoints / totalCredits;
  }, [subjects, marks, whatIfMarks]);

  const weightageData = useMemo(() => {
    if (mode !== 'stats') return [];
    return subjects.map(s => ({ name: s.name, value: s.credits }));
  }, [subjects, mode]);

  const handleExport = () => {
    window.print();
  };

  const resetSemester = () => {
    const newMarks: Record<string, SubjectMarks> = {};
    subjects.forEach(s => {
      newMarks[s.id] = { theory: null, internal: null, practical: null };
    });
    setMarks(newMarks);
  };

  return (
    <div className="min-h-screen bg-white pb-10 sm:pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[--color-apple-border] px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6H6L12 12L6 18H18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">IOE GPA Calculator</h1>
            <p className="text-[10px] sm:text-[11px] text-[--color-apple-gray] font-bold uppercase tracking-[0.2em]">Official Syllabus 2081 Criteria</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Mode Switcher */}
        <div className="flex justify-center mb-8 sm:mb-16 no-print overflow-x-auto pb-4">
          <div className="bg-black/[0.03] p-1.5 rounded-2xl flex gap-1.5 border border-black/[0.05] shadow-inner shrink-0">
            {[
              { id: 'semester', label: 'Semester GPA', icon: Calculator },
              { id: 'aggregate', label: 'Aggregate CGPA', icon: TrendingUp },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'simulator', label: 'Target Simulator', icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as any)}
                className={`relative px-6 py-3 rounded-xl text-xs font-bold transition-all duration-300 border-2 flex items-center gap-2 whitespace-nowrap ${
                  mode === tab.id 
                    ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-[1.02] border-black' 
                    : 'text-[--color-apple-gray] hover:text-black hover:bg-black/[0.02] border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'semester' ? (
            <motion.div
              key="semester"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-[--color-apple-gray] uppercase ml-1">Calculate Semester GPA</h2>
                  <div className="relative">
                    <select
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value as Faculty)}
                      className="apple-input appearance-none pr-10 h-11"
                    >
                      <option value="">Select Faculty</option>
                      {Object.keys(SUBJECT_DATABASE).map(f => (
                        <option key={f} value={f}>
                          {f === 'Architecture' ? f : `${f} Engineering`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-apple-gray] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[--color-apple-gray] uppercase ml-1">Semester</label>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(parseInt(e.target.value))}
                      className="apple-input appearance-none pr-10 h-11"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => {
                        if (faculty !== 'Architecture' && s > 8) return null;
                        return (
                          <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester</option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-apple-gray] pointer-events-none" />
                  </div>
                </div>
              </div>

              {subjects.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="apple-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-none !bg-black !text-white">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] sm:text-xs font-medium text-white/60 uppercase tracking-widest mb-1">Semester GPA</p>
                      <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter">{semesterStats.gpa.toFixed(2)}</h2>
                      <p className="text-base sm:text-lg font-semibold mt-2 text-white/90">{getDivision(semesterStats.gpa)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-4">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase">Total Credits</p>
                        <p className="text-lg sm:text-xl font-semibold">{semesterStats.totalCredits}</p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase">Grade Points</p>
                        <p className="text-lg sm:text-xl font-semibold">{semesterStats.totalGradePoints.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase">Total Marks</p>
                        <p className="text-lg sm:text-xl font-semibold">{semesterStats.totalObtained.toFixed(1)} / {semesterStats.totalFull}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post-Calculation Ad */}
                  <GoogleAd adSlot="2297473424" className="my-4 sm:my-6" />

                  {/* Subjects Table */}
                  <div className="apple-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[--color-apple-bg] border-b border-[--color-apple-border]">
                            <th className="px-6 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase">Subject</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Credit</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Theory</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Internal</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Practical</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Grade</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-right">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[--color-apple-border]">
                          {subjects.map(s => (
                            <SubjectRow 
                              key={s.id} 
                              subject={s} 
                              marks={marks[s.id] || { theory: null, internal: null, practical: null }} 
                              onChange={handleMarkChange} 
                            />
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[--color-apple-bg]/30 font-bold">
                            <td className="px-6 py-4 text-sm">Total</td>
                            <td className="px-4 py-4 text-center text-sm">{semesterStats.totalCredits}</td>
                            <td colSpan={3} className="px-4 py-4 text-center text-sm">
                              {semesterStats.totalObtained.toFixed(1)} / {semesterStats.totalFull}
                            </td>
                            <td className="px-4 py-4 text-center text-sm">
                              {semesterStats.gpa.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {semesterStats.totalGradePoints.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 no-print">
                    <button onClick={resetSemester} className="apple-button-secondary flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset Marks</span>
                    </button>
                    <button onClick={handleExport} className="apple-button-secondary flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="apple-card p-20 text-center border-dashed">
                  <BookOpen className="w-12 h-12 text-[--color-apple-border] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Faculty & Semester</h3>
                  <p className="text-sm text-[--color-apple-gray] mb-4">Choose your program and semester above to load subjects automatically.</p>
                  <div className="max-w-md mx-auto p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Once you enter your marks, we'll generate advanced statistics, identify "Near Misses", detect your "Engineering Archetype", and provide a GPA recovery roadmap.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : mode === 'aggregate' ? (
            <motion.div
              key="aggregate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Aggregate Summary */}
                  <div className="apple-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-none !bg-black !text-white">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] sm:text-xs font-medium text-white/60 uppercase tracking-widest mb-1">Cumulative GPA (CGPA)</p>
                      <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter">{aggregateStats.cgpa.toFixed(2)}</h2>
                      <p className="text-base sm:text-lg font-semibold mt-2 text-white/90">{getDivision(aggregateStats.cgpa)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-white/50 uppercase">Total Credits</p>
                        <p className="text-xl font-semibold">{aggregateStats.totalCredits}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/50 uppercase">Total Points</p>
                        <p className="text-xl font-semibold">{aggregateStats.totalPoints.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-white/50 uppercase">Semesters Added</p>
                        <p className="text-xl font-semibold">{aggregateSems.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Semester Rows */}
                  <div className="apple-card p-6 space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-2 mb-2">
                      <div className="col-span-5 text-[10px] font-bold text-[--color-apple-gray] uppercase">
                        <h2 className="text-[10px] font-bold uppercase">Aggregate CGPA</h2>
                      </div>
                      <div className="col-span-3 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">GPA</div>
                      <div className="col-span-3 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Credits</div>
                      <div className="col-span-1"></div>
                    </div>
                    {aggregateSems.map((sem, idx) => (
                      <div key={sem.id} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <p className="text-sm font-semibold">{idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Semester</p>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="4"
                            value={isNaN(sem.gpa) ? '' : sem.gpa}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newSems = [...aggregateSems];
                              newSems[idx].gpa = val === '' ? 0 : parseFloat(val) || 0;
                              setAggregateSems(newSems);
                            }}
                            className="apple-input text-center h-10"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            value={isNaN(sem.credits) ? '' : sem.credits}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newSems = [...aggregateSems];
                              newSems[idx].credits = val === '' ? 0 : parseFloat(val) || 0;
                              setAggregateSems(newSems);
                            }}
                            className="apple-input text-center h-10"
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => setAggregateSems(aggregateSems.filter(s => s.id !== sem.id))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setAggregateSems([...aggregateSems, { id: Math.random().toString(), gpa: 0, credits: 0 }])}
                      className="w-full py-3 border-2 border-dashed border-[--color-apple-border] rounded-xl text-[--color-apple-gray] font-semibold text-sm hover:border-[--color-apple-blue] hover:text-[--color-apple-blue] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Semester</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* CGPA Optimization Tool */}
                  <div className="apple-card p-6 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      CGPA Optimizer
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Target Graduation CGPA</span>
                          <span>{gradGoal.toFixed(2)}</span>
                        </div>
                        <input 
                          type="range" min="2.0" max="4.0" step="0.05" value={isNaN(gradGoal) ? 3.75 : gradGoal} 
                          onChange={(e) => setGradGoal(parseFloat(e.target.value) || 3.75)}
                          className="apple-range"
                        />
                      </div>
                      
                      <div className="p-4 bg-black text-white rounded-2xl space-y-3">
                        <p className="text-[10px] text-white/50 uppercase font-bold">Required Performance</p>
                        {(() => {
                          const remainingSems = 8 - aggregateSems.length;
                          if (remainingSems <= 0) return <p className="text-xs">You have completed all semesters.</p>;
                          
                          const totalCreditsNeeded = 160; // Approximate total credits
                          const currentCredits = aggregateStats.totalCredits;
                          const currentPoints = aggregateStats.totalPoints;
                          const targetPoints = gradGoal * totalCreditsNeeded;
                          const neededPoints = targetPoints - currentPoints;
                          const neededAvgGPA = neededPoints / (totalCreditsNeeded - currentCredits);
                          
                          if (neededAvgGPA > 4.0) {
                            return <p className="text-xs text-rose-400 font-bold">Mathematically impossible to reach {gradGoal.toFixed(2)} with current credits.</p>;
                          }
                          if (neededAvgGPA < 2.0) {
                            return <p className="text-xs text-emerald-400 font-bold">You've already secured this goal! Just maintain a 2.00 GPA.</p>;
                          }
                          
                          return (
                            <>
                              <p className="text-3xl font-bold tracking-tighter">{neededAvgGPA.toFixed(2)}</p>
                              <p className="text-[10px] text-white/60 leading-relaxed">
                                You need to average <span className="text-white font-bold">{neededAvgGPA.toFixed(2)} GPA</span> in your remaining {remainingSems} semesters to graduate with a {gradGoal.toFixed(2)} CGPA.
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="apple-card p-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4">Export Report</h3>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => setAggregateSems([{ id: '1', gpa: 0, credits: 0 }])} className="apple-button-secondary w-full flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>Clear All</span>
                      </button>
                      <button onClick={handleExport} className="apple-button w-full flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Download PDF Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : mode === 'stats' ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {subjects.length > 0 && Object.values(marks).some(m => m.theory !== null || m.internal !== null) ? (
                <>
                  {/* Interactive What-If Header */}
                  <div className="apple-card p-6 sm:p-10 text-center space-y-4 !bg-black !text-white border-none">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Simulated GPA (What-If)</p>
                    <h2 className="text-6xl font-bold tracking-tighter">{whatIfGPA.toFixed(2)}</h2>
                    <p className="text-xs text-white/60">Drag the sliders below to see how improving specific subjects affects your overall GPA.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stacked Marks Distribution Chart */}
                    <div className="lg:col-span-2 apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Stacked Component Analysis
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-black/5">
                                      <p className="text-xs font-bold mb-2">{data.fullName}</p>
                                      <div className="space-y-1">
                                        <p className="text-[10px] flex justify-between gap-4"><span>Theory:</span> <span>{data.theory}</span></p>
                                        <p className="text-[10px] flex justify-between gap-4"><span>Internal:</span> <span className={data.isCapped ? 'text-red-500 font-bold' : ''}>{data.internal} {data.isCapped && '(Capped)'}</span></p>
                                        <p className="text-[10px] flex justify-between gap-4"><span>Practical:</span> <span>{data.practical}</span></p>
                                        <div className="pt-1 mt-1 border-t border-black/5">
                                          <p className="text-[10px] font-bold flex justify-between gap-4"><span>Total:</span> <span>{data.theory + data.internal + data.practical} / {data.full}</span></p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="theory" stackId="a" fill="#000" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="internal" stackId="a" fill="#666" />
                            <Bar dataKey="practical" stackId="a" fill="#ccc" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-sm"></div><span className="text-[10px] font-bold uppercase">Theory</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#666] rounded-sm"></div><span className="text-[10px] font-bold uppercase">Internal</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ccc] rounded-sm"></div><span className="text-[10px] font-bold uppercase">Practical</span></div>
                      </div>
                    </div>

                    {/* Near Misses & Clutch Saves */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Near Misses
                      </h3>
                      <div className="space-y-3">
                        {insights?.nearMisses.length ? insights.nearMisses.map((miss, i) => (
                          <div key={i} className={`p-4 rounded-2xl border ${miss.isClutch ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold">{miss.subject}</span>
                              <span className={`text-[10px] font-bold uppercase ${miss.isClutch ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {miss.isClutch ? 'Clutch!' : `-${miss.marksToNext} Marks`}
                              </span>
                            </div>
                            <p className="text-[10px] text-black/60">
                              {miss.isClutch 
                                ? `Scored exactly the minimum needed for ${miss.nextGrade}.` 
                                : `You missed an ${miss.nextGrade} by just ${miss.marksToNext} marks. (Cost: -${miss.gpaLoss.toFixed(2)} GPA)`}
                            </p>
                          </div>
                        )) : (
                          <p className="text-xs text-black/40 italic text-center py-8">No near misses detected.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Carry & Anchor */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        MVP & Needs Improvement
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">The Carry</p>
                          {insights?.carrySubjects[0] ? (
                            <p className="text-xs font-medium text-emerald-900">
                              <span className="font-bold">{insights.carrySubjects[0].subject}</span> single-handedly boosted your GPA by +{insights.carrySubjects[0].impact.toFixed(2)} above average.
                            </p>
                          ) : <p className="text-xs text-emerald-900/60">No single subject is carrying significantly.</p>}
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                          <p className="text-[10px] font-bold text-rose-600 uppercase mb-2">The Anchor</p>
                          {insights?.anchorSubjects[0] ? (
                            <p className="text-xs font-medium text-rose-900">
                              <span className="font-bold">{insights.anchorSubjects[0].subject}</span> dragged your overall GPA down. Focus on this subject type next semester.
                            </p>
                          ) : <p className="text-xs text-rose-900/60">No single subject is dragging significantly.</p>}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Sliders */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        Time Machine Simulator
                      </h3>
                      <div className="space-y-4">
                        {subjects.slice(0, 4).map(s => (
                          <div key={s.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase">{s.name}</span>
                              <span className="text-[10px] font-mono">{whatIfMarks[s.id] ?? (marks[s.id]?.theory || 0)} / {s.theoryFull}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={s.theoryFull} 
                              value={isNaN(whatIfMarks[s.id] ?? (marks[s.id]?.theory || 0)) ? 0 : (whatIfMarks[s.id] ?? (marks[s.id]?.theory || 0))}
                              onChange={(e) => setWhatIfMarks(prev => ({ ...prev, [s.id]: parseInt(e.target.value) || 0 }))}
                              className="apple-range"
                            />
                          </div>
                        ))}
                        <p className="text-[9px] text-black/40 italic">Showing top 4 subjects. Adjust theory marks to see real-time GPA impact.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ROI Scatter Plot */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Study ROI (Effort vs Reward)
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" dataKey="credits" name="Credits" unit=" Cr" axisLine={false} tickLine={false} />
                            <YAxis type="number" dataKey="percentage" name="Score" unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
                            <ZAxis type="number" range={[100, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 rounded-xl shadow-xl border border-black/5">
                                    <p className="text-[10px] font-bold">{data.subject}</p>
                                    <p className="text-[10px]">Zone: <span className="font-bold">{data.zone}</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }} />
                            <Scatter name="Subjects" data={insights?.roiData} fill="#000">
                              {insights?.roiData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.zone === 'Danger' ? '#ef4444' : entry.zone === 'Golden' ? '#10b981' : entry.zone === 'Easy Wins' ? '#3b82f6' : '#000'} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="text-[9px] text-red-500 font-bold">● Danger: High Credit + Low Score</div>
                        <div className="text-[9px] text-emerald-500 font-bold">● Golden: High Credit + High Score</div>
                      </div>
                    </div>

                    {/* Capping Severity Heatmap */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Capping Severity Heatmap
                      </h3>
                      <div className="space-y-4">
                        {subjects.map(s => {
                          const m = marks[s.id] || { theory: 0, internal: 0 };
                          const theoryPct = ((m.theory || 0) / (s.theoryFull || 1)) * 100;
                          const internalPct = ((m.internal || 0) / (s.internalFull || 1)) * 100;
                          const gap = internalPct - theoryPct;
                          const severity = gap > 20 ? 'Critical' : gap > 15 ? 'Warning' : 'Safe';
                          
                          return (
                            <div key={s.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold">{s.name}</span>
                                <span className={`text-[9px] font-bold uppercase ${severity === 'Critical' ? 'text-red-500' : severity === 'Warning' ? 'text-amber-500' : 'text-emerald-500'}`}>{severity}</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${severity === 'Critical' ? 'bg-red-500' : severity === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, (gap / 20) * 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[9px] text-black/40 leading-relaxed mt-4">
                          If the gap between Internal and Theory percentage exceeds 20%, your marks are capped. Study theory to unlock your internal potential.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="apple-card p-20 text-center border-dashed">
                  <BarChart3 className="w-12 h-12 text-[--color-apple-border] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data to Analyze</h3>
                  <p className="text-sm text-[--color-apple-gray]">Please enter your marks in the Semester GPA tab first to unlock advanced statistics.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="apple-card p-6 sm:p-10 text-center space-y-8 !bg-black !text-white border-none">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Target Semester GPA</p>
                    <h2 className="text-6xl font-bold tracking-tighter">{targetGPA.toFixed(2)}</h2>
                  </div>
                  
                  <input
                    type="range"
                    min="2.0"
                    max="4.0"
                    step="0.01"
                    value={isNaN(targetGPA) ? 3.6 : targetGPA}
                    onChange={(e) => setTargetGPA(parseFloat(e.target.value) || 3.6)}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  
                  <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                    <span>2.00 (Pass)</span>
                    <span>4.00 (Perfect)</span>
                  </div>
                </div>
              </div>

              {subjects.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Engineer Archetype */}
                    <div className="apple-card p-6 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                        <Award className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1">Your Engineering Profile</p>
                        <h3 className="text-lg font-bold mb-1">{insights?.archetype.title}</h3>
                        <p className="text-xs text-black/60 leading-relaxed">{insights?.archetype.description}</p>
                      </div>
                    </div>

                    {/* Backlog Warning */}
                    <div className="apple-card p-6 flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        subjects.some(s => (marks[s.id]?.theory || 0) < s.theoryFull * 0.4) ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1">Risk Assessment</p>
                        <h3 className="text-lg font-bold mb-1">
                          {subjects.some(s => (marks[s.id]?.theory || 0) < s.theoryFull * 0.4) ? 'Risky Zone' : 'Safe Passage'}
                        </h3>
                        <p className="text-xs text-black/60 leading-relaxed">
                          {subjects.some(s => (marks[s.id]?.theory || 0) < s.theoryFull * 0.4) 
                            ? "Heads up: You're currently in the 'Risky' zone for some subjects. A little more push in theory will secure your pass."
                            : "You are currently meeting all minimum pass criteria. Keep it up!"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* GPA Recovery Roadmap */}
                    <div className="apple-card p-6 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Road to Graduation
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span>Graduation Goal</span>
                            <span>{gradGoal.toFixed(2)} CGPA</span>
                          </div>
                          <input 
                            type="range" min="2.0" max="4.0" step="0.05" value={isNaN(gradGoal) ? 3.75 : gradGoal} 
                            onChange={(e) => setGradGoal(parseFloat(e.target.value) || 3.75)}
                            className="apple-range"
                          />
                        </div>
                        <div className="p-4 bg-black text-white rounded-2xl">
                          <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Required Avg GPA</p>
                          <p className="text-2xl font-bold tracking-tighter">
                            {((gradGoal * 8 - semesterStats.gpa) / 7).toFixed(2)}
                          </p>
                          <p className="text-[9px] text-white/60 mt-2">
                            To graduate with a {gradGoal.toFixed(2)}, you need to average this for the next 7 semesters.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* High Impact Subjects */}
                    <div className="apple-card p-6 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        High Impact Focus
                      </h3>
                      <div className="space-y-2">
                        {subjects.sort((a, b) => b.credits - a.credits).slice(0, 3).map(s => (
                          <div key={s.id} className="p-3 bg-black/5 rounded-xl border border-black/5">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold">{s.name}</span>
                              <span className="text-[10px] font-bold text-black/40">{s.credits} Credits</span>
                            </div>
                            <p className="text-[9px] text-black/60">Focus 2x more effort here. It has the highest impact on your CGPA.</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brag Sheet */}
                    <div className="apple-card p-6 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Resume Brag Sheet
                      </h3>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Top Competencies</p>
                        <div className="space-y-2">
                          {subjects.filter(s => {
                            const m = marks[s.id] || { theory: 0, internal: 0, practical: 0 };
                            const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
                            return res.grade.gp >= 3.7;
                          }).length > 0 ? (
                            <p className="text-xs font-medium text-emerald-900 leading-relaxed">
                              Demonstrated academic excellence in {subjects.filter(s => {
                                const m = marks[s.id] || { theory: 0, internal: 0, practical: 0 };
                                const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
                                return res.grade.gp >= 3.7;
                              }).map(s => s.name).join(', ')}.
                            </p>
                          ) : <p className="text-xs text-emerald-900/60 italic">Score A or A- in subjects to generate competencies.</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="apple-card overflow-hidden">
                    <div className="bg-black text-white p-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Suggested Marks Distribution</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[--color-apple-bg] border-b border-[--color-apple-border]">
                            <th className="px-6 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase">Subject</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Theory</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Internal</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Practical</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-right">Target Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[--color-apple-border]">
                          {(() => {
                            if (!simulatedMarks) return null;
                            if (typeof simulatedMarks === 'string') {
                              return (
                                <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="max-w-sm mx-auto space-y-2">
                                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                                      <p className="text-sm font-bold text-red-600">{simulatedMarks}</p>
                                      <p className="text-xs text-[--color-apple-gray]">Try lowering your target GPA or checking your syllabus constraints.</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return subjects.map(s => {
                              const m = simulatedMarks[s.id];
                              const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
                              return (
                                <tr key={s.id} className="hover:bg-[--color-apple-bg]/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-semibold">{s.name}</td>
                                  <td className="px-4 py-4 text-center text-sm">
                                    {s.theoryFull > 0 ? `${m.theory} / ${s.theoryFull}` : '—'}
                                  </td>
                                  <td className="px-4 py-4 text-center text-sm">
                                    {s.internalFull > 0 ? `${m.internal} / ${s.internalFull}` : '—'}
                                  </td>
                                  <td className="px-4 py-4 text-center text-sm">
                                    {s.practicalFull > 0 ? `${m.practical} / ${s.practicalFull}` : '—'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-black text-white">
                                      {res.grade.letter}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="apple-card p-20 text-center border-dashed">
                  <Target className="w-12 h-12 text-[--color-apple-border] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Faculty First</h3>
                  <p className="text-sm text-[--color-apple-gray]">We need to know your subjects to simulate a target GPA.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Methodology Section (Always Visible) */}
        <div className="mt-12 space-y-8 no-print">
          <div className="apple-card p-6 sm:p-10 bg-white border border-[--color-apple-border]">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-12 text-center">How to Calculate IOE CGPA & GPA</h2>
            
            <div className="space-y-16">
              {/* I. The 20% Threshold Rule */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">I</div>
                  <h2 className="text-sm font-bold uppercase tracking-tight">The 20% Threshold Rule (Internal Capping)</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <p className="text-xs text-[--color-apple-gray] leading-relaxed">
                      In the IOE system, your college internal marks are not "set in stone." They are <span className="text-black font-semibold">anchored</span> to your performance in the Final Board Exam. This ensures that internal marks reflect the academic capability demonstrated in the standardized final exam.
                    </p>
                    <p className="text-xs text-[--color-apple-gray] leading-relaxed italic">
                      Think of it as a safety check: Your Internal score cannot be more than 20% higher than your Theory score.
                    </p>
                    
                    <div className="bg-[--color-apple-bg] p-4 rounded-lg border border-[--color-apple-border] space-y-3">
                      <h4 className="text-[9px] font-bold text-black uppercase">Mathematical Logic</h4>
                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between"><span>Theory Percentage (P<sub>t</sub>)</span> <span className="font-mono">(Obtained ÷ Full) × 100</span></div>
                        <div className="flex justify-between"><span>The Ceiling (C)</span> <span className="font-mono">P<sub>t</sub> + 20</span></div>
                        <div className="flex justify-between border-t border-[--color-apple-border] pt-2 font-bold"><span>Adjusted Internal</span> <span className="font-mono">(C ÷ 100) × Full Internal</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black text-white p-6 rounded-xl space-y-4">
                    <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Real-World Example: The "Reality Check"</h3>
                    <div className="space-y-3">
                      <p className="text-[11px] leading-relaxed">
                        Subject: <span className="text-white font-bold">Engineering Physics</span> (60 Theory / 40 Internal)
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div className="bg-white/10 p-2 rounded">
                          <p className="text-white/50 mb-1">Board Exam</p>
                          <p className="font-bold">18 / 60 (30%)</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded">
                          <p className="text-white/50 mb-1">College Internals</p>
                          <p className="font-bold">38 / 40 (95%)</p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-1">
                        <p className="text-[10px] text-white/70">Ceiling: 30% + 20% = <span className="text-white font-bold">50%</span></p>
                        <p className="text-[10px] text-white/70">Final Score: 50% of 40 = <span className="text-white font-bold">20 / 40</span></p>
                        <p className="text-[10px] text-red-400 font-bold mt-2">Loss: Student effectively loses 18 marks.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Methodology Ad */}
              <GoogleAd adSlot="3174832011" className="my-4 sm:my-8" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* II. Separate Pass Criteria */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">II</div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest">Separate Pass Criteria</h2>
                  </div>
                  <p className="text-xs text-[--color-apple-gray] leading-relaxed">
                    You must obtain a minimum of <span className="text-black font-semibold">40%</span> in each individual component:
                  </p>
                  <div className="space-y-1.5 text-[10px] font-medium">
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>Theory</span> <span className="font-bold">≥ 24 / 60 (or 32 / 80)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>Internal</span> <span className="font-bold">≥ 16 / 40 (or 8 / 20)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>Practical</span> <span className="font-bold">≥ 10 / 25 (or 20 / 50)</span></div>
                  </div>
                  <p className="text-[9px] text-red-500 font-bold italic">Failing any component results in an overall 'F'.</p>
                </section>

                {/* III. GPA Formula */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">III</div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest">GPA Formula</h2>
                  </div>
                  <p className="text-xs text-[--color-apple-gray] leading-relaxed">
                    GPA is a Credit-Weighted Mean, ensuring high-credit subjects impact your score more.
                  </p>
                  <div className="bg-[--color-apple-bg] p-3 rounded border border-[--color-apple-border] text-center">
                    <div className="inline-block text-left">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="font-bold">GPA =</span>
                        <div className="flex flex-col items-center">
                          <span className="border-b border-black px-2">Σ (Grade Point × Credits)</span>
                          <span>Σ (Total Credits)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Formula Ad */}
                  <GoogleAd adSlot="9329785632" className="mt-4" />
                </section>

                {/* IV. Grading Scale */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">IV</div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest">Grading Scale (2080/81)</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[9px] font-medium">
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>80% +</span> <span className="font-bold">A (4.0)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>75% - 79%</span> <span className="font-bold">A- (3.7)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>70% - 74%</span> <span className="font-bold">B+ (3.3)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>65% - 69%</span> <span className="font-bold">B (3.0)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>60% - 64%</span> <span className="font-bold">B- (2.7)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>55% - 59%</span> <span className="font-bold">C+ (2.3)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>50% - 54%</span> <span className="font-bold">C (2.0)</span></div>
                    <div className="flex justify-between border-b border-[--color-apple-border] pb-1"><span>40% - 49%</span> <span className="font-bold">D (1.0)</span></div>
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[--color-apple-border] text-center">
              <p className="text-[10px] text-[--color-apple-gray] font-medium uppercase tracking-widest">
                To "protect" your high internal marks, you must perform well in the final board exam.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Leaderboard Ad */}
      <div className="w-full bg-[--color-apple-bg] border-t border-[--color-apple-border] py-6 mt-6 sm:mt-20 no-print">
        <div className="max-w-4xl mx-auto px-6">
          <GoogleAd adSlot="4027702501" />
        </div>
      </div>

      {/* Print-only Footer */}
      <footer className="hidden print:block mt-20 text-center border-t border-[--color-apple-border] pt-10">
        <p className="text-xs text-[--color-apple-gray] font-medium uppercase tracking-widest">Official IOE GPA Report</p>
        <p className="text-[10px] text-[--color-apple-gray] mt-2">Generated on {new Date().toLocaleDateString()} via IOE GPA Calculator</p>
      </footer>
    </div>
  );
}
