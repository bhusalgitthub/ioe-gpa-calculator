export interface Subject {
  id: string;
  name: string;
  credits: number;
  theoryFull: number;
  internalFull: number;
  practicalFull: number;
}

export interface SubjectMarks {
  theory: number | null;
  internal: number | null;
  practical: number | null;
}

export interface SemesterResult {
  id: string;
  gpa: number;
  credits: number;
}

export type Faculty = 'Civil' | 'Computer' | 'BEI' | 'Mechanical' | 'Electrical' | 'Architecture';

export interface GradeInfo {
  letter: string;
  gp: number;
}

export interface PerformanceInsight {
  cappingRisks: { subject: string; loss: number; severity: 'low' | 'medium' | 'high' }[];
  impactSubjects: { subject: string; weight: number }[];
  strengthZones: { category: string; subjects: string[] }[];
  optimizationPoints: { text: string; gpaIncrease: number }[];
  nearMisses: { subject: string; marksToNext: number; nextGrade: string; gpaLoss: number; isClutch: boolean }[];
  carrySubjects: { subject: string; impact: number }[];
  anchorSubjects: { subject: string; impact: number }[];
  archetype: { title: string; description: string };
  roiData: { subject: string; credits: number; percentage: number; zone: 'Danger' | 'Easy Wins' | 'Golden' | 'Neutral' }[];
  cv?: number;
}
