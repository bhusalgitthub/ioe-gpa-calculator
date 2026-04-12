import { GradeInfo } from '../types';

export function getGrade(pct: number): GradeInfo {
  if (pct >= 80) return { letter: 'A', gp: 4.0 };
  if (pct >= 75) return { letter: 'A-', gp: 3.7 };
  if (pct >= 70) return { letter: 'B+', gp: 3.3 };
  if (pct >= 65) return { letter: 'B', gp: 3.0 };
  if (pct >= 60) return { letter: 'B-', gp: 2.7 };
  if (pct >= 55) return { letter: 'C+', gp: 2.3 };
  if (pct >= 50) return { letter: 'C', gp: 2.0 };
  if (pct >= 40) return { letter: 'D', gp: 1.0 };
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
