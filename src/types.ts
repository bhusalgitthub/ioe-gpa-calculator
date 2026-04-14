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
  cappingRisks: { subject: string; loss: number }[];
  impactSubjects: { subject: string; weight: number }[];
  strengthZones: { category: string; subjects: string[] }[];
  optimizationPoints: { text: string; gpaIncrease: number }[];
  cv?: number;
}
