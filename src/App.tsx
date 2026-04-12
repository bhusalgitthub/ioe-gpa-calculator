import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, BookOpen, Download, RotateCcw, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Faculty, Subject, SubjectMarks, SemesterResult } from './types';
import { SUBJECT_DATABASE } from './data/subjects';
import { calculateSubjectGPA, getDivision } from './lib/calculations';

export default function App() {
  const [mode, setMode] = useState<'semester' | 'aggregate'>('semester');
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
      return SUBJECT_DATABASE[faculty][semester as number] || [];
    }
    return [];
  }, [faculty, semester]);

  // Initialize marks when subjects change
  useEffect(() => {
    const newMarks: Record<string, SubjectMarks> = {};
    subjects.forEach(s => {
      newMarks[s.id] = { theory: null, internal: null, practical: null };
    });
    setMarks(newMarks);
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
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[--color-apple-border] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
            <Calculator className="text-white w-5 h-5" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">IOE GPA Calculator (Syllabus 2081)</h1>
            <p className="text-[9px] sm:text-[10px] text-[--color-apple-gray] font-medium uppercase tracking-widest">Institute of Engineering</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        {/* Mode Switcher */}
        <div className="flex justify-center mb-12 no-print">
          <div className="bg-[--color-apple-bg] p-1 rounded-xl flex gap-1 border border-[--color-apple-border]">
            <button
              onClick={() => setMode('semester')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'semester' ? 'bg-white shadow-sm text-black' : 'text-[--color-apple-gray] hover:text-black'
              }`}
            >
              Semester GPA
            </button>
            <button
              onClick={() => setMode('aggregate')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'aggregate' ? 'bg-white shadow-sm text-black' : 'text-[--color-apple-gray] hover:text-black'
              }`}
            >
              Aggregate CGPA
            </button>
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
                        <option key={f} value={f}>{f} Engineering</option>
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
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-apple-gray] pointer-events-none" />
                  </div>
                </div>
              </div>

              {subjects.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="apple-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-none bg-black text-white">
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
                  <div className="w-full flex justify-center no-print">
                    <div className="w-full h-[100px] bg-[--color-apple-bg] border border-[--color-apple-border] rounded-xl flex items-center justify-center text-[--color-apple-gray] text-[10px] font-bold uppercase tracking-widest">
                      Advertisement — Success Banner (Responsive)
                    </div>
                  </div>

                  {/* Subjects Table */}
                  <div className="apple-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[--color-apple-bg] border-b border-[--color-apple-border]">
                            <th className="px-6 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase">Subject</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-[--color-apple-gray] uppercase text-center">Cr</th>
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
                                        value={m.theory ?? ''}
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
                                        value={m.internal ?? ''}
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
                                        value={m.practical ?? ''}
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
                  <div className="apple-card p-10 bg-white border border-[--color-apple-border] no-print">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-12 text-center">Academic Methodology & Standards</h3>
                    
                    <div className="space-y-16">
                      {/* I. The 20% Threshold Rule */}
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">I</div>
                          <h2 className="text-sm font-bold uppercase tracking-tight">The 20% Threshold Rule (Internal Capping)</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-black uppercase tracking-widest">The "Anchor Principle"</h3>
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
                      <div className="w-full flex justify-center no-print">
                        <div className="w-full h-[90px] bg-[--color-apple-bg] border border-[--color-apple-border] rounded-xl flex items-center justify-center text-[--color-apple-gray] text-[10px] font-bold uppercase tracking-widest">
                          Advertisement — Content Break (Responsive)
                        </div>
                      </div>

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
                          <div className="pt-4 no-print">
                            <div className="w-full h-[60px] bg-[--color-apple-bg] border border-[--color-apple-border] rounded-lg flex items-center justify-center text-[--color-apple-gray] text-[9px] font-bold uppercase tracking-widest">
                              Advertisement — Formula Banner
                            </div>
                          </div>
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
          ) : (
            <motion.div
              key="aggregate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Aggregate Summary */}
                <div className="apple-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-none bg-black text-white">
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
              <div className="w-full flex justify-center no-print">
                <div className="w-full h-[100px] bg-[--color-apple-bg] border border-[--color-apple-border] rounded-xl flex items-center justify-center text-[--color-apple-gray] text-[10px] font-bold uppercase tracking-widest">
                  Advertisement — Success Banner (Responsive)
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
                        value={sem.gpa || ''}
                        onChange={(e) => {
                          const newSems = [...aggregateSems];
                          newSems[idx].gpa = parseFloat(e.target.value) || 0;
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
                        value={sem.credits || ''}
                        onChange={(e) => {
                          const newSems = [...aggregateSems];
                          newSems[idx].credits = parseFloat(e.target.value) || 0;
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
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Leaderboard Ad */}
      <div className="w-full bg-[--color-apple-bg] border-t border-[--color-apple-border] py-6 mt-20 no-print">
        <div className="max-w-4xl mx-auto flex justify-center px-6">
          <div className="w-full max-w-[728px] h-[90px] bg-white border border-[--color-apple-border] rounded-lg flex items-center justify-center text-[--color-apple-gray] text-xs font-bold uppercase tracking-widest text-center px-4">
            Advertisement — Bottom Leaderboard (728x90)
          </div>
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
