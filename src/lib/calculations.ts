import { GradeInfo, Subject, SubjectMarks, PerformanceInsight, SemesterResult } from '../types';

export function getGrade(pct: number): GradeInfo {
  // Rounding to 2 decimal places for boundary cases
  const roundedPct = Math.round(pct * 100) / 100;
  if (roundedPct >= 80) return { letter: 'A', gp: 4.0 };
  if (roundedPct >= 75) return { letter: 'A-', gp: 3.7 };
  if (roundedPct >= 70) return { letter: 'B+', gp: 3.3 };
  if (roundedPct >= 65) return { letter: 'B', gp: 3.0 };
  if (roundedPct >= 60) return { letter: 'B-', gp: 2.7 };
  if (roundedPct >= 55) return { letter: 'C+', gp: 2.3 };
  if (roundedPct >= 50) return { letter: 'C', gp: 2.0 };
  if (roundedPct >= 40) return { letter: 'D', gp: 1.0 };
  return { letter: 'F', gp: 0.0 };
}

export function getDivision(gpa: number): string {
  if (gpa >= 3.6) return 'Distinction';
  if (gpa >= 3.2) return 'First Division';
  if (gpa >= 2.8) return 'Second Division';
  if (gpa >= 2.0) return 'Pass';
  return 'Fail';
}

export interface CalculationResult {
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: GradeInfo;
  isCapped: boolean;
  effectiveInternal: number;
}

export function calculateSubjectGPA(
  theoryObt: number | null,
  theoryFull: number,
  internalObt: number | null,
  internalFull: number,
  practicalObt: number | null,
  practicalFull: number
): CalculationResult {
  const tObt = theoryObt || 0;
  const iObt = internalObt || 0;
  const pObt = practicalObt || 0;

  let effectiveInternal = iObt;
  let isCapped = false;
  
  const isTheoryFail = theoryFull > 0 && tObt < (0.4 * theoryFull);
  const isInternalFail = internalFull > 0 && iObt < (0.4 * internalFull);
  const isPracticalFail = practicalFull > 0 && pObt < (0.4 * practicalFull);
  const hasFailedComponent = isTheoryFail || isInternalFail || isPracticalFail;

  // IOE 20% Rule: Only applies if there is a theory component
  if (theoryFull > 0 && internalFull > 0) {
    const theoryPct = (tObt / theoryFull) * 100;
    const internalPct = (iObt / internalFull) * 100;
    const maxInternalPct = theoryPct + 20;

    if (internalPct > maxInternalPct) {
      effectiveInternal = (maxInternalPct / 100) * internalFull;
      isCapped = true;
    }
  }

  const totalObtained = tObt + effectiveInternal + pObt;
  const totalFull = theoryFull + internalFull + practicalFull;
  const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  
  let grade = getGrade(percentage);
  if (hasFailedComponent) {
    grade = { letter: 'F', gp: 0.0 };
  }

  return {
    totalObtained,
    totalFull,
    percentage,
    grade,
    isCapped,
    effectiveInternal
  };
}

export function calculateWeightedCGPA(semesters: SemesterResult[]): number {
  // Weightage mapping: Sem 1-4: 10%, Sem 5-8: 15%
  // For Architecture (10 sems), we assume the last 2 years are 15% each sem and first 3 are 10%?
  // Actually the image shows 4 years. Let's stick to the 8 sem model for weighting.
  // If more than 8 sems, we'll normalize.
  
  const weights = [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15]; // Up to 10 sems
  
  let totalWeight = 0;
  let weightedPoints = 0;
  
  semesters.forEach((sem, index) => {
    if (sem.gpa > 0) {
      const w = weights[index] || 0.15;
      weightedPoints += sem.gpa * w;
      totalWeight += w;
    }
  });
  
  return totalWeight > 0 ? weightedPoints / totalWeight : 0;
}

export function generateInsights(subjects: Subject[], marks: Record<string, SubjectMarks>): PerformanceInsight {
  const cappingRisks: { subject: string; loss: number; severity: 'low' | 'medium' | 'high' }[] = [];
  const impactSubjects: { subject: string; weight: number }[] = [];
  const strengthZones: { category: string; subjects: string[] }[] = [];
  const optimizationPoints: { text: string; gpaIncrease: number }[] = [];
  const nearMisses: { subject: string; marksToNext: number; nextGrade: string; gpaLoss: number; isClutch: boolean }[] = [];
  const carrySubjects: { subject: string; impact: number }[] = [];
  const anchorSubjects: { subject: string; impact: number }[] = [];
  const roiData: { subject: string; credits: number; percentage: number; zone: 'Danger' | 'Easy Wins' | 'Golden' | 'Neutral' }[] = [];

  const currentResults = subjects.map(s => {
    const m = marks[s.id] || { theory: null, internal: null, practical: null };
    return {
      subject: s,
      res: calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull)
    };
  });

  const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
  const currentGPA = totalCredits > 0 ? currentResults.reduce((acc, r) => acc + r.res.grade.gp * r.subject.credits, 0) / totalCredits : 0;

  const percentages = currentResults.map(r => r.res.percentage);
  const mean = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
  const variance = percentages.length > 0 ? percentages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / percentages.length : 0;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const categories: Record<string, string[]> = {
    'Analytical': ['Mathematics', 'Statistics', 'Numerical', 'Probability', 'Mechanics', 'Dynamics'],
    'Implementation': ['Programming', 'Workshop', 'Drawing', 'Studio', 'Graphics', 'Sketching', 'Project', 'Internship', 'Laboratory'],
    'Applied Science': ['Chemistry', 'Geology', 'Materials', 'Physics', 'Thermodynamics', 'Hydraulics', 'Soil', 'Survey']
  };

  const catScores: Record<string, { total: number; count: number }> = {
    'Analytical': { total: 0, count: 0 },
    'Implementation': { total: 0, count: 0 },
    'Applied Science': { total: 0, count: 0 }
  };

  currentResults.forEach(({ subject, res }) => {
    // Capping Risk
    if (res.isCapped) {
      const m = marks[subject.id];
      const loss = (m.internal || 0) - res.effectiveInternal;
      const severity = loss > 10 ? 'high' : loss > 5 ? 'medium' : 'low';
      cappingRisks.push({ subject: subject.name, loss, severity });
    }

    // Carry & Anchor
    const impact = (res.grade.gp - currentGPA) * subject.credits;
    if (impact > 0.1) carrySubjects.push({ subject: subject.name, impact });
    if (impact < -0.1) anchorSubjects.push({ subject: subject.name, impact: Math.abs(impact) });

    // ROI Data
    let zone: 'Danger' | 'Easy Wins' | 'Golden' | 'Neutral' = 'Neutral';
    if (subject.credits >= 3 && res.percentage < 60) zone = 'Danger';
    else if (subject.credits < 3 && res.percentage >= 80) zone = 'Easy Wins';
    else if (subject.credits >= 3 && res.percentage >= 80) zone = 'Golden';
    roiData.push({ subject: subject.name, credits: subject.credits, percentage: res.percentage, zone });

    // Near Misses
    const boundaries = [
      { pct: 80, grade: 'A' }, { pct: 75, grade: 'A-' }, { pct: 70, grade: 'B+' },
      { pct: 65, grade: 'B' }, { pct: 60, grade: 'B-' }, { pct: 55, grade: 'C+' },
      { pct: 50, grade: 'C' }, { pct: 40, grade: 'D' }
    ];
    
    const nextBoundary = boundaries.find(b => b.pct > res.percentage);
    if (nextBoundary) {
      const totalFull = subject.theoryFull + subject.internalFull + subject.practicalFull;
      const marksNeeded = Math.ceil((nextBoundary.pct / 100) * totalFull) - res.totalObtained;
      
      if (marksNeeded <= 3 && marksNeeded > 0) {
        const nextGP = getGrade(nextBoundary.pct).gp;
        const gpaLoss = ((nextGP - res.grade.gp) * subject.credits) / totalCredits;
        nearMisses.push({ 
          subject: subject.name, 
          marksToNext: marksNeeded, 
          nextGrade: nextBoundary.grade, 
          gpaLoss,
          isClutch: false 
        });
      }
    }

    // Clutch Check (Exactly on boundary)
    const onBoundary = boundaries.find(b => Math.abs(b.pct - res.percentage) < 0.1);
    if (onBoundary) {
      nearMisses.push({
        subject: subject.name,
        marksToNext: 0,
        nextGrade: onBoundary.grade,
        gpaLoss: 0,
        isClutch: true
      });
    }

    // Archetype Data
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => subject.name.includes(k))) {
        catScores[cat].total += res.percentage;
        catScores[cat].count++;
        
        const zone = strengthZones.find(z => z.category === cat);
        if (zone) zone.subjects.push(subject.name);
        else strengthZones.push({ category: cat, subjects: [subject.name] });
        break;
      }
    }
  });

  // Determine Archetype
  let topCat = 'Versatile Generalist';
  let maxAvg = 0;
  for (const [cat, data] of Object.entries(catScores)) {
    if (data.count > 0) {
      const avg = data.total / data.count;
      if (avg > maxAvg && avg > 70) {
        maxAvg = avg;
        topCat = cat;
      }
    }
  }

  const archetypeMap: Record<string, { title: string; description: string }> = {
    'Analytical': { title: 'The Structural Visionary', description: 'You excel in mathematical logic and structural analysis. Your strength lies in solving complex numerical problems.' },
    'Implementation': { title: 'The Systems Architect', description: 'You are a master of practical implementation and design. You turn abstract concepts into working systems.' },
    'Applied Science': { title: 'The Scientific Explorer', description: 'You have a deep understanding of the fundamental sciences that power engineering.' },
    'Versatile Generalist': { title: 'The Versatile Generalist', description: 'You maintain a balanced performance across all engineering disciplines.' }
  };

  // Optimization Points
  subjects.forEach(s => {
    const m = marks[s.id] || { theory: null, internal: null, practical: null };
    if (s.theoryFull > 0 && m.theory !== null && m.theory < s.theoryFull) {
      const improvedTheory = Math.min(s.theoryFull, m.theory + 5);
      const improvedRes = calculateSubjectGPA(improvedTheory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      const newGPA = (currentResults.reduce((acc, r) => r.subject.id === s.id ? acc + improvedRes.grade.gp * s.credits : acc + r.res.grade.gp * r.subject.credits, 0)) / totalCredits;
      if (newGPA > currentGPA) {
        optimizationPoints.push({
          text: `Score 5 more marks in ${s.name} theory`,
          gpaIncrease: newGPA - currentGPA
        });
      }
    }
  });

  return {
    cappingRisks,
    impactSubjects: impactSubjects.sort((a, b) => b.weight - a.weight).slice(0, 3),
    strengthZones,
    optimizationPoints: optimizationPoints.sort((a, b) => b.gpaIncrease - a.gpaIncrease).slice(0, 3),
    nearMisses: nearMisses.sort((a, b) => a.marksToNext - b.marksToNext),
    carrySubjects: carrySubjects.sort((a, b) => b.impact - a.impact),
    anchorSubjects: anchorSubjects.sort((a, b) => b.impact - a.impact),
    archetype: archetypeMap[topCat],
    roiData,
    cv
  };
}

export function simulateTargetGPA(subjects: Subject[], targetGPA: number): Record<string, SubjectMarks> | string {
  if (targetGPA > 4.0) return "Feasibility Error: Maximum possible GPA is 4.0.";
  if (targetGPA < 0) return "Feasibility Error: Minimum possible GPA is 0.0.";

  const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
  const requiredPoints = targetGPA * totalCredits;

  // Initialize: Practical and Internal to FULL, Theory to PASS (40%)
  const marks: Record<string, SubjectMarks> = {};
  subjects.forEach(s => {
    marks[s.id] = {
      theory: s.theoryFull > 0 ? Math.ceil(0.4 * s.theoryFull) : 0,
      internal: s.internalFull,
      practical: s.practicalFull
    };
  });

  const getPoints = (m: Record<string, SubjectMarks>) => {
    return subjects.reduce((acc, s) => {
      const res = calculateSubjectGPA(m[s.id].theory, s.theoryFull, m[s.id].internal, s.internalFull, m[s.id].practical, s.practicalFull);
      return acc + res.grade.gp * s.credits;
    }, 0);
  };

  let currentPoints = getPoints(marks);
  
  // If even with full practical/internal and pass theory we exceed target, 
  // we can try to lower theory (but user said "change value in theory marks only" 
  // and "keep practical full", so we'll stick with pass theory as minimum).
  if (currentPoints >= requiredPoints) {
    return marks;
  }

  // Greedy approach: increment THEORY marks only to reach target
  // We'll increment by 1 mark at a time across subjects to find a balanced distribution
  let improved = true;
  let iterations = 0;
  const maxIterations = 2000; // Increased safety break for mark-by-mark increments

  while (currentPoints < requiredPoints && improved && iterations < maxIterations) {
    improved = false;
    
    // Sort subjects by credits (descending) to prioritize high-impact subjects for theory increments
    const sortedSubjects = [...subjects].sort((a, b) => b.credits - a.credits);

    for (const s of sortedSubjects) {
      if (s.theoryFull === 0) continue;
      const m = marks[s.id];
      
      if ((m.theory || 0) < s.theoryFull) {
        m.theory = (m.theory || 0) + 1;
        const newPoints = getPoints(marks);
        
        if (newPoints > currentPoints) {
          currentPoints = newPoints;
          improved = true;
        } else {
          // If adding 1 mark didn't change GPA (didn't cross boundary), 
          // we still keep it and continue searching
          improved = true;
        }
        
        iterations++;
        if (currentPoints >= requiredPoints) break;
      }
    }
  }

  if (currentPoints < requiredPoints) {
    return "Feasibility Error: Target GPA is mathematically impossible even with full practicals and 100% theory.";
  }

  return marks;
}
