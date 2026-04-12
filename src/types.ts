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

export type Faculty = 'Civil' | 'Computer' | 'BEI' | 'Mechanical' | 'Electrical';

export interface GradeInfo {
  letter: string;
  gp: number;
}
