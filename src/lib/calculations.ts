import { GradeInfo, Subject, SubjectMarks, PerformanceInsight } from '../types';

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

export function generateInsights(subjects: Subject[], marks: Record<string, SubjectMarks>): PerformanceInsight {
  const cappingRisks: { subject: string; loss: number }[] = [];
  const impactSubjects: { subject: string; weight: number }[] = [];
  const strengthZones: { category: string; subjects: string[] }[] = [];
  const optimizationPoints: { text: string; gpaIncrease: number }[] = [];

  const percentages = subjects.map(s => {
    const m = marks[s.id] || { theory: null, internal: null, practical: null };
    const res = calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
    return res.percentage;
  });

  const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const variance = percentages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / percentages.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const categories: Record<string, string[]> = {
    'Analytical': ['Mathematics', 'Statistics', 'Numerical', 'Probability'],
    'Applied': ['Mechanics', 'Dynamics', 'Structures', 'Thermodynamics', 'Hydraulics', 'Hydrology', 'Soil', 'Survey'],
    'Lab-based': ['Programming', 'Workshop', 'Drawing', 'Studio', 'Graphics', 'Sketching', 'Project', 'Internship']
  };

  const currentResults = subjects.map(s => {
    const m = marks[s.id] || { theory: null, internal: null, practical: null };
    return {
      subject: s,
      res: calculateSubjectGPA(m.theory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull)
    };
  });

  const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
  const currentGPA = totalCredits > 0 ? currentResults.reduce((acc, r) => acc + r.res.grade.gp * r.subject.credits, 0) / totalCredits : 0;

  currentResults.forEach(({ subject, res }) => {
    // Capping Risk
    if (res.isCapped) {
      const m = marks[subject.id];
      const loss = (m.internal || 0) - res.effectiveInternal;
      cappingRisks.push({ subject: subject.name, loss });
    }

    // Impact
    impactSubjects.push({ subject: subject.name, weight: subject.credits });

    // Strength Zones
    let categorized = false;
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => subject.name.includes(k))) {
        const zone = strengthZones.find(z => z.category === cat);
        if (zone) zone.subjects.push(subject.name);
        else strengthZones.push({ category: cat, subjects: [subject.name] });
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      const zone = strengthZones.find(z => z.category === 'Others');
      if (zone) zone.subjects.push(subject.name);
      else strengthZones.push({ category: 'Others', subjects: [subject.name] });
    }
  });

  // Optimization Points (What-If)
  subjects.forEach(s => {
    const m = marks[s.id] || { theory: null, internal: null, practical: null };
    if (s.theoryFull > 0 && m.theory !== null && m.theory < s.theoryFull) {
      const improvedTheory = Math.min(s.theoryFull, m.theory + 5);
      const improvedRes = calculateSubjectGPA(improvedTheory, s.theoryFull, m.internal, s.internalFull, m.practical, s.practicalFull);
      
      const newTotalPoints = currentResults.reduce((acc, r) => {
        if (r.subject.id === s.id) return acc + improvedRes.grade.gp * s.credits;
        return acc + r.res.grade.gp * r.subject.credits;
      }, 0);
      
      const newGPA = newTotalPoints / totalCredits;
      if (newGPA > currentGPA) {
        optimizationPoints.push({
          text: `If you scored 5 more marks in ${s.name} theory, your GPA would increase to ${newGPA.toFixed(2)}.`,
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
    cv
  };
}

export function simulateTargetGPA(subjects: Subject[], targetGPA: number): Record<string, SubjectMarks> | string {
  if (targetGPA > 4.0) return "Feasibility Error: Maximum possible GPA is 4.0.";
  if (targetGPA < 0) return "Feasibility Error: Minimum possible GPA is 0.0.";

  const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
  const requiredPoints = targetGPA * totalCredits;

  // Try to find a distribution
  // We'll use a simple heuristic: start with all subjects at 40% (pass)
  // then increment percentages until we reach the target GPA
  
  const marks: Record<string, SubjectMarks> = {};
  subjects.forEach(s => {
    marks[s.id] = {
      theory: s.theoryFull > 0 ? Math.ceil(0.4 * s.theoryFull) : 0,
      internal: s.internalFull > 0 ? Math.ceil(0.4 * s.internalFull) : 0,
      practical: s.practicalFull > 0 ? Math.ceil(0.4 * s.practicalFull) : 0
    };
  });

  const getPoints = (m: Record<string, SubjectMarks>) => {
    return subjects.reduce((acc, s) => {
      const res = calculateSubjectGPA(m[s.id].theory, s.theoryFull, m[s.id].internal, s.internalFull, m[s.id].practical, s.practicalFull);
      return acc + res.grade.gp * s.credits;
    }, 0);
  };

  let currentPoints = getPoints(marks);
  if (currentPoints > requiredPoints) {
     // Even at pass marks, we exceed target. This is fine, just return pass marks.
     return marks;
  }

  // Greedy approach: increment subjects one by one to the next grade boundary
  const gradeBoundaries = [50, 55, 60, 65, 70, 75, 80];
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 100; // Safety break

  while (currentPoints < requiredPoints && improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (const s of subjects) {
      const m = marks[s.id];
      const totalFull = s.theoryFull + s.internalFull + s.practicalFull;
      if (totalFull === 0) continue;

      const currentTotal = (m.theory || 0) + (m.internal || 0) + (m.practical || 0);
      const currentPct = (currentTotal / totalFull) * 100;
      
      const nextBoundary = gradeBoundaries.find(b => b > currentPct + 0.01); // Use small epsilon
      if (nextBoundary) {
        const neededTotal = Math.ceil((nextBoundary / 100) * totalFull);
        let diff = neededTotal - currentTotal;
        
        if (diff <= 0) continue;

        let changed = false;
        // Distribute diff: Theory first, then Practical, then Internal
        if (s.theoryFull > 0 && (m.theory || 0) < s.theoryFull) {
          const canAdd = s.theoryFull - (m.theory || 0);
          const toAdd = Math.min(diff, canAdd);
          m.theory = (m.theory || 0) + toAdd;
          diff -= toAdd;
          if (toAdd > 0) changed = true;
        }
        
        if (diff > 0 && s.practicalFull > 0 && (m.practical || 0) < s.practicalFull) {
          const canAdd = s.practicalFull - (m.practical || 0);
          const toAdd = Math.min(diff, canAdd);
          m.practical = (m.practical || 0) + toAdd;
          diff -= toAdd;
          if (toAdd > 0) changed = true;
        }

        if (diff > 0 && s.internalFull > 0 && (m.internal || 0) < s.internalFull) {
          const canAdd = s.internalFull - (m.internal || 0);
          const toAdd = Math.min(diff, canAdd);
          m.internal = (m.internal || 0) + toAdd;
          diff -= toAdd;
          if (toAdd > 0) changed = true;
        }
        
        if (changed) {
          const newPoints = getPoints(marks);
          if (newPoints > currentPoints) {
            currentPoints = newPoints;
            improved = true;
          }
          if (currentPoints >= requiredPoints) break;
        }
      }
    }
  }

  if (currentPoints < requiredPoints) {
    return "Feasibility Error: Target GPA is mathematically impossible with the current syllabus constraints.";
  }

  return marks;
}
