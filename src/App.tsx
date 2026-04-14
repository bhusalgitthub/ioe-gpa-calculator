import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, BookOpen, Download, RotateCcw, Plus, Trash2, ChevronDown, BarChart3, Target, AlertTriangle, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Faculty, Subject, SubjectMarks, SemesterResult } from './types';
import { SUBJECT_DATABASE } from './data/subjects';
import { calculateSubjectGPA, getDivision, generateInsights, simulateTargetGPA } from './lib/calculations';
import GoogleAd from './components/GoogleAd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const EMPTY_ARRAY: any[] = [];

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

  // Persistence effects
  useEffect(() => {
    if (faculty) localStorage.setItem('ioe_faculty', faculty);
    if (semester) localStorage.setItem('ioe_semester', semester.toString());
  }, [faculty, semester]);

  useEffect(() => {
    localStorage.setItem('ioe_marks', JSON.stringify(marks));
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
      const m = marks[s.id] || { theory: 0, internal: 0, practical: 0 };
      const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      return {
        name: s.name.split(' ').map(w => w[0]).join(''),
        fullName: s.name,
        obtained: res.totalObtained,
        full: res.totalFull,
        pct: res.percentage
      };
    });
  }, [subjects, marks, mode]);

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
                  <GoogleAd adSlot="2297473424" className="my-6" />

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
                          {subjects.map(s => {
                            const m = marks[s.id] || { theory: null, internal: null, practical: null };
                            const res = calculateSubjectGPA(
                              m.theory, s.theoryFull,
                              m.internal, s.internalFull,
                              m.practical, s.practicalFull
                            );
                            return (
                              <tr key={s.id} className="hover:bg-[--color-apple-bg]/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-semibold">{s.name}</p>
                                  {res.isCapped && <span className="text-[9px] text-black/40 font-bold uppercase tracking-tighter block mt-0.5">Capped by 20% rule</span>}
                                </td>
                                <td className="px-4 py-4 text-center text-sm font-medium text-[--color-apple-gray]">{s.credits}</td>
                                <td className="px-4 py-4">
                                  {s.theoryFull > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="—"
                                        value={m.theory === null || isNaN(m.theory) ? '' : m.theory}
                                        onChange={(e) => handleMarkChange(s.id, 'theory', e.target.value, s.theoryFull)}
                                        className={`apple-input w-16 text-center h-8 ${m.theory !== null && m.theory < s.theoryFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
                                      />
                                      <span className="text-[10px] text-[--color-apple-gray]">/ {s.theoryFull}</span>
                                    </div>
                                  ) : <span className="text-[--color-apple-gray] block text-center">—</span>}
                                </td>
                                <td className="px-4 py-4">
                                  {s.internalFull > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="—"
                                        value={m.internal === null || isNaN(m.internal) ? '' : m.internal}
                                        onChange={(e) => handleMarkChange(s.id, 'internal', e.target.value, s.internalFull)}
                                        className={`apple-input w-16 text-center h-8 ${m.internal !== null && m.internal < s.internalFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
                                      />
                                      <span className="text-[10px] text-[--color-apple-gray]">/ {s.internalFull}</span>
                                    </div>
                                  ) : <span className="text-[--color-apple-gray] block text-center">—</span>}
                                </td>
                                <td className="px-4 py-4">
                                  {s.practicalFull > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="—"
                                        value={m.practical === null || isNaN(m.practical) ? '' : m.practical}
                                        onChange={(e) => handleMarkChange(s.id, 'practical', e.target.value, s.practicalFull)}
                                        className={`apple-input w-16 text-center h-8 ${m.practical !== null && m.practical < s.practicalFull * 0.4 ? 'border-red-500 text-red-600' : ''}`}
                                      />
                                      <span className="text-[10px] text-[--color-apple-gray]">/ {s.practicalFull}</span>
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
                                  {(res.grade.gp * s.credits).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
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

                  {/* Methodology Section */}
                  <div className="apple-card p-6 sm:p-10 bg-white border border-[--color-apple-border] no-print">
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
                      <GoogleAd adSlot="3174832011" className="my-8" />

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
              ) : (
                <div className="apple-card p-20 text-center border-dashed">
                  <BookOpen className="w-12 h-12 text-[--color-apple-border] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Faculty & Semester</h3>
                  <p className="text-sm text-[--color-apple-gray]">Choose your program and semester above to load subjects automatically.</p>
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

              {/* Post-Calculation Ad */}
              <GoogleAd adSlot="2297473424" className="my-6" />

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

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 no-print">
                <button onClick={() => setAggregateSems([{ id: '1', gpa: 0, credits: 0 }])} className="apple-button-secondary flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
                <button onClick={handleExport} className="apple-button-secondary flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
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
              {subjects.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Marks Distribution Chart */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Marks Distribution
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                              formatter={(value: any, name: any, props: any) => [`${value} / ${props.payload.full}`, 'Marks']}
                              labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                            />
                            <Bar dataKey="obtained" radius={[4, 4, 0, 0]}>
                              {subjects.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#000' : '#666'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Credit Weightage Pie */}
                    <div className="apple-card p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Credit Weightage
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={weightageData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {subjects.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#000' : '#ccc'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="apple-card p-6 sm:p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Performance Insights
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Capping Audit */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-[--color-apple-gray] uppercase flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          20% Capping Audit
                        </h4>
                        <div className="space-y-2">
                          {insights && insights.cappingRisks.length > 0 ? (
                            insights.cappingRisks.map((risk, i) => (
                              <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex justify-between items-center">
                                <span className="text-xs font-semibold text-amber-900">{risk.subject}</span>
                                <span className="text-[10px] font-bold text-amber-600">-{risk.loss.toFixed(1)} Marks Lost</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[--color-apple-gray] italic">No capping risks detected. Internal marks are well-balanced.</p>
                          )}
                        </div>
                        
                        {/* CV Metric */}
                        <div className="mt-6 p-4 bg-black/[0.02] rounded-2xl border border-black/[0.05]">
                          <p className="text-[10px] font-bold text-[--color-apple-gray] uppercase mb-1">Consistency (CV)</p>
                          <p className="text-2xl font-bold tracking-tighter">
                            {insights?.cv?.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-[--color-apple-gray] mt-1">
                            { (insights?.cv || 0) < 15 ? 'Excellent consistency across subjects.' : 'High variation in subject performance.' }
                          </p>
                        </div>
                      </div>

                      {/* Optimization Points */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-[--color-apple-gray] uppercase flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          Optimization Points
                        </h4>
                        <div className="space-y-2">
                          {insights?.optimizationPoints.map((point, i) => (
                            <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                              <p className="text-xs text-emerald-900 leading-relaxed">{point.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="apple-card p-20 text-center border-dashed">
                  <BarChart3 className="w-12 h-12 text-[--color-apple-border] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data to Analyze</h3>
                  <p className="text-sm text-[--color-apple-gray]">Please enter your marks in the Semester GPA tab first.</p>
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
                    value={targetGPA}
                    onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  
                  <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                    <span>2.00 (Pass)</span>
                    <span>4.00 (Perfect)</span>
                  </div>
                </div>
              </div>

              {subjects.length > 0 ? (
                <div className="space-y-6">
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
                  <p className="text-[10px] text-[--color-apple-gray] text-center italic">
                    * This distribution is a mathematical suggestion to reach your goal while ensuring all pass criteria are met.
                  </p>
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
