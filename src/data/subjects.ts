import { Subject, Faculty } from '../types';

export const SUBJECT_DATABASE: Record<Faculty, Record<number, Subject[]>> = {
  Civil: {
    1: [
      { id: 'c101', name: 'Engineering Mathematics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'c102', name: 'Engineering Chemistry', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'c103', name: 'Computer Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'c104', name: 'Basic Electrical and Electronics Engineering', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'c105', name: 'Engineering Mechanics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'c106', name: 'Engineering Geology I', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 25 },
      { id: 'c107', name: 'Civil Engineering Materials', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 25 },
    ],
    2: [
      { id: 'c201', name: 'Engineering Mathematics II', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'c202', name: 'Engineering Physics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'c203', name: 'Engineering Drawing', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 50 },
      { id: 'c204', name: 'Strength of Materials', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'c205', name: 'Engineering Geology II', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 25 },
      { id: 'c206', name: 'Survey I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
    ],
    4: [
      { id: 'c401', name: 'Hydraulics', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'c402', name: 'Surveying II', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'c403', name: 'Theory of Structures I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'c404', name: 'Probability and Statistics', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'c405', name: 'Engineering Geology II', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 25 },
      { id: 'c406', name: 'Building Drawing', credits: 2, theoryFull: 0, internalFull: 20, practicalFull: 50 },
      { id: 'c407', name: 'Soil Mechanics', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
    ],
    // Add more semesters as needed...
  },
  Computer: {
    1: [
      { id: 'com101', name: 'Engineering Mathematics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'com102', name: 'Computer Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'com103', name: 'Engineering Drawing', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 50 },
      { id: 'com104', name: 'Fundamental of Electrical and Electronics Engineering', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'com105', name: 'Engineering Physics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'com106', name: 'Engineering Workshop', credits: 1, theoryFull: 0, internalFull: 20, practicalFull: 30 },
    ],
    2: [
      { id: 'com201', name: 'Engineering Mathematics II', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'com202', name: 'Engineering Chemistry', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'com203', name: 'Electronic Device and Circuits', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'com204', name: 'Object Oriented Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'com205', name: 'Electrical Circuits and Machines', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'com206', name: 'Digital Logic', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
    ],
  },
  BEI: {
    1: [
      { id: 'bei101', name: 'Engineering Mathematics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'bei102', name: 'Computer Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'bei103', name: 'Engineering Drawing', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 50 },
      { id: 'bei104', name: 'Fundamental of Electrical and Electronics Engineering', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'bei105', name: 'Engineering Physics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'bei106', name: 'Engineering Workshop', credits: 1, theoryFull: 0, internalFull: 20, practicalFull: 30 },
    ],
    2: [
      { id: 'bei201', name: 'Engineering Mathematics II', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'bei202', name: 'Object Oriented Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'bei203', name: 'Digital Logic', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'bei204', name: 'Electronic Devices and Circuits', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'bei205', name: 'Engineering Chemistry', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'bei206', name: 'Electrical Circuits and Machines', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
    ],
  },
  Mechanical: {
    1: [
      { id: 'm101', name: 'Engineering Mathematics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'm102', name: 'Engineering Physics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'm103', name: 'Computer Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'm104', name: 'Fundamental of Electrical and Electronics Engineering', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'm105', name: 'Engineering Drawing', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 50 },
      { id: 'm106', name: 'Engineering Mechanics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
    ],
    2: [],
  },
  Electrical: {
    1: [
      { id: 'e101', name: 'Engineering Mathematics I', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
      { id: 'e102', name: 'Engineering Physics', credits: 4, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      { id: 'e103', name: 'Computer Programming', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'e104', name: 'Fundamental of Electrical and Electronics Engineering', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
      { id: 'e105', name: 'Engineering Drawing', credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 50 },
      { id: 'e106', name: 'Applied Mechanics', credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
    ],
    2: [],
  }
};

// Fill in placeholders for missing semesters to avoid crashes
Object.keys(SUBJECT_DATABASE).forEach(faculty => {
  const fac = faculty as Faculty;
  for (let i = 1; i <= 8; i++) {
    if (!SUBJECT_DATABASE[fac][i]) {
      SUBJECT_DATABASE[fac][i] = [
        { id: `${fac.toLowerCase()}${i}01`, name: `Subject ${i}-1`, credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
        { id: `${fac.toLowerCase()}${i}02`, name: `Subject ${i}-2`, credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
        { id: `${fac.toLowerCase()}${i}03`, name: `Subject ${i}-3`, credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 50 },
        { id: `${fac.toLowerCase()}${i}04`, name: `Subject ${i}-4`, credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 0 },
        { id: `${fac.toLowerCase()}${i}05`, name: `Subject ${i}-5`, credits: 2, theoryFull: 30, internalFull: 20, practicalFull: 25 },
        { id: `${fac.toLowerCase()}${i}06`, name: `Subject ${i}-6`, credits: 3, theoryFull: 60, internalFull: 40, practicalFull: 25 },
      ];
    }
  }
});
