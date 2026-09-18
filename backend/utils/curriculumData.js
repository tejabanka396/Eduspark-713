/**
 * EduSpark Standard Curriculum & Syllabus Definition
 * Maps Grade/Class Levels + Subjects -> Chapters -> Topics
 */

const CURRICULUM = {
  'Grade 4': {
    'Mathematics': [
      {
        chapter: 'Chapter 1: Fractions & Decimals',
        topics: ['Basic Fractions', 'Equivalent Fractions', 'Adding & Subtracting Fractions', 'Decimals Basics', 'Comparing Decimals'],
      },
      {
        chapter: 'Chapter 2: Multi-Digit Multiplication & Division',
        topics: ['Multi-Digit Multiplication', 'Long Division with Remainders', 'Estimating Products', 'Multiplication Word Problems'],
      },
      {
        chapter: 'Chapter 3: Geometry & Measurement',
        topics: ['Angles and Lines', 'Perimeter and Area', 'Units of Measure', 'Symmetry in Shapes'],
      },
      {
        chapter: 'Chapter 4: Algebraic Thinking & Patterns',
        topics: ['Patterns and Rules', 'Simple Algebraic Equations', 'Multi-Step Word Problems'],
      },
    ],
    'Science': [
      {
        chapter: 'Chapter 1: Plants and Their Parts',
        topics: ['Photosynthesis and Chlorophyll', 'Plant Life Cycle', 'Plant Adaptations', 'Pollination and Seeds'],
      },
      {
        chapter: 'Chapter 2: States of Matter & Energy',
        topics: ['Solids, Liquids, and Gases', 'Heat Transfer & Temperature', 'Simple Electrical Circuits'],
      },
      {
        chapter: 'Chapter 3: Earth, Water, and Weather',
        topics: ['The Water Cycle', 'Weather Patterns and Clouds', 'Earth Movements and Sun'],
      },
    ],
    'English Language Arts': [
      {
        chapter: 'Chapter 1: Reading Comprehension',
        topics: ['Main Idea and Key Details', 'Context Clues', 'Character Analysis & Story Elements'],
      },
      {
        chapter: 'Chapter 2: Grammar & Sentence Mechanics',
        topics: ['Parts of Speech: Nouns and Verbs', 'Adjectives and Adverbs', 'Punctuation and Capitalization'],
      },
    ],
    'Social Studies': [
      {
        chapter: 'Chapter 1: Geography & Maps',
        topics: ['Map Skills and Hemispheres', 'Landforms and Bodies of Water', 'Natural Resources'],
      },
      {
        chapter: 'Chapter 2: Communities and Cultures',
        topics: ['Early Civilizations', 'Community Roles and Citizens', 'Trade and Currency'],
      },
    ],
  },
  'Grade 5': {
    'Mathematics': [
      {
        chapter: 'Chapter 1: Fractions Operations',
        topics: ['Multiplying Fractions', 'Dividing Unit Fractions', 'Mixed Numbers Word Problems'],
      },
      {
        chapter: 'Chapter 2: Decimals & Percentages',
        topics: ['Adding and Subtracting Decimals', 'Converting Fractions to Decimals', 'Introduction to Percentages'],
      },
      {
        chapter: 'Chapter 3: Volume & 3D Geometry',
        topics: ['Cubic Units', 'Volume of Rectangular Prisms', 'Classifying 2D and 3D Figures'],
      },
    ],
    'Science': [
      {
        chapter: 'Chapter 1: Ecosystems & Food Webs',
        topics: ['Producers, Consumers, Decomposers', 'Energy Flow in Ecosystems', 'Biomes of the World'],
      },
      {
        chapter: 'Chapter 2: Forces & Motion',
        topics: ['Gravity and Friction', 'Newton’s Laws of Motion', 'Balanced and Unbalanced Forces'],
      },
    ],
    'English Language Arts': [
      {
        chapter: 'Chapter 1: Literary Analysis',
        topics: ['Theme and Moral of Stories', 'Poetry Forms and Rhyme Schemes', 'Informational Text Structures'],
      },
      {
        chapter: 'Chapter 2: Writing & Syntax',
        topics: ['Compound and Complex Sentences', 'Transition Words', 'Persuasive Writing'],
      },
    ],
    'Social Studies': [
      {
        chapter: 'Chapter 1: World History Foundations',
        topics: ['Ancient Civilizations', 'The Age of Exploration', 'Colonial Economics'],
      },
    ],
  },
  'Grade 6': {
    'Mathematics': [
      {
        chapter: 'Chapter 1: Ratios and Proportions',
        topics: ['Unit Rates', 'Ratio Tables', 'Percents of Quantities'],
      },
      {
        chapter: 'Chapter 2: Algebraic Expressions & Equations',
        topics: ['Variables and Expressions', 'One-Variable Equations', 'Inequalities on a Number Line'],
      },
    ],
    'Science': [
      {
        chapter: 'Chapter 1: Cell Biology',
        topics: ['Cell Structure and Organelles', 'Plant vs Animal Cells', 'Microscopic Organisms'],
      },
      {
        chapter: 'Chapter 2: Earth Systems & Astronomy',
        topics: ['Plate Tectonics', 'The Solar System & Planetary Orbits', 'Erosion and Rock Cycles'],
      },
    ],
  },
};

// Fallback chapters/topics for any generic class/subject
const DEFAULT_CHAPTERS = [
  {
    chapter: 'Chapter 1: Core Fundamentals',
    topics: ['Concept Introduction', 'Core Definitions', 'Guided Problem Solving'],
  },
  {
    chapter: 'Chapter 2: Intermediate Applications',
    topics: ['Practical Application', 'Problem Solving Methods', 'Review & Practice'],
  },
];

/**
 * Normalize grade/class strings: 'Grade 4 - Alpha' -> 'Grade 4'
 */
const normalizeGrade = (classOrGradeStr) => {
  if (!classOrGradeStr || typeof classOrGradeStr !== 'string') return 'Grade 4';
  const match = classOrGradeStr.match(/Grade\s*\d+/i);
  return match ? match[0].replace(/\s+/g, ' ') : classOrGradeStr.trim();
};

/**
 * Get assigned classes, subjects, chapters, and topics for a teacher
 */
const getTeacherCurriculumOptions = (teacherUser) => {
  if (!teacherUser) {
    return { assignedClasses: [], assignedSubjects: [], curriculum: {} };
  }

  // Determine assigned classes/grades
  let assignedClasses = [];
  if (teacherUser.assignedClass) {
    assignedClasses.push(teacherUser.assignedClass);
  }
  if (Array.isArray(teacherUser.assignedClasses) && teacherUser.assignedClasses.length > 0) {
    teacherUser.assignedClasses.forEach((c) => {
      if (!assignedClasses.includes(c)) assignedClasses.push(c);
    });
  }
  if (Array.isArray(teacherUser.grades) && teacherUser.grades.length > 0) {
    teacherUser.grades.forEach((g) => {
      if (!assignedClasses.includes(g)) assignedClasses.push(g);
    });
  } else if (teacherUser.grade) {
    if (!assignedClasses.includes(teacherUser.grade)) assignedClasses.push(teacherUser.grade);
  }
  if (assignedClasses.length === 0) {
    assignedClasses = ['Grade 4 - Alpha', 'Grade 4'];
  }

  // Determine assigned subjects
  let assignedSubjects = [];
  if (Array.isArray(teacherUser.subjects) && teacherUser.subjects.length > 0) {
    assignedSubjects = [...teacherUser.subjects];
  } else if (teacherUser.subject) {
    assignedSubjects = [teacherUser.subject];
  }
  if (assignedSubjects.length === 0) {
    assignedSubjects = ['Mathematics', 'Science'];
  }

  // Build the hierarchical curriculum tree for the teacher
  const tree = {};
  assignedClasses.forEach((cls) => {
    const gradeKey = normalizeGrade(cls);
    tree[cls] = {};

    assignedSubjects.forEach((subj) => {
      const gradeCurriculum = CURRICULUM[gradeKey] || CURRICULUM['Grade 4'];
      const chaptersList = gradeCurriculum[subj] || DEFAULT_CHAPTERS;

      tree[cls][subj] = chaptersList.map((ch) => ({
        chapter: ch.chapter,
        topics: [...ch.topics],
      }));
    });
  });

  return {
    assignedClasses,
    assignedSubjects,
    curriculum: tree,
  };
};

/**
 * Validate teacher authorization for class, subject, chapter, and topic
 */
const validateTeacherCurriculumSelection = (teacherUser, { className, grade, subject, chapter, topic }) => {
  if (!teacherUser) {
    return { isValid: false, status: 401, message: 'Authentication required.' };
  }

  // Admins have full authorization
  if (teacherUser.role === 'admin') {
    return { isValid: true };
  }

  const { assignedClasses, assignedSubjects, curriculum } = getTeacherCurriculumOptions(teacherUser);

  // 1. Verify Class Assignment
  const reqClass = className || grade;
  const isClassAssigned = assignedClasses.some((ac) => {
    return (
      ac.toLowerCase() === (reqClass || '').toLowerCase() ||
      normalizeGrade(ac).toLowerCase() === normalizeGrade(reqClass || '').toLowerCase()
    );
  });

  if (!isClassAssigned) {
    return {
      isValid: false,
      status: 403,
      message: `You are not authorized to add or manage content for class '${reqClass}'. Only assigned classes are allowed.`,
    };
  }

  // 2. Verify Subject Assignment
  const isSubjectAssigned = assignedSubjects.some(
    (as) => as.toLowerCase() === (subject || '').toLowerCase()
  );

  if (!isSubjectAssigned) {
    return {
      isValid: false,
      status: 403,
      message: `You are not authorized to add or manage content for subject '${subject}'. Only assigned subjects are allowed.`,
    };
  }

  // 3. Verify Chapter
  if (!chapter || typeof chapter !== 'string' || chapter.trim() === '') {
    return {
      isValid: false,
      status: 400,
      message: 'Please select or provide a valid Chapter.',
    };
  }

  // 4. Verify Topic
  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return {
      isValid: false,
      status: 400,
      message: 'Please select or provide a valid Topic.',
    };
  }

  return { isValid: true };
};

module.exports = {
  CURRICULUM,
  normalizeGrade,
  getTeacherCurriculumOptions,
  validateTeacherCurriculumSelection,
};
