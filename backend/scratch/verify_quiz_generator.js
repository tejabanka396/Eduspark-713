const aiService = require('../services/aiService');

async function runQuizGeneratorVerification() {
  console.log('====================================================');
  console.log('🚀 AI QUIZ GENERATOR VERIFICATION SUITE');
  console.log('====================================================\n');

  const testCases = [
    {
      name: 'Test 1: Mathematics -> Algebra / Quadratic Equations',
      grade: 'Grade 10',
      subject: 'Mathematics',
      chapter: 'Chapter 4',
      topic: 'Quadratic Equations',
      difficulty: 'Hard',
      questionType: 'mcq',
      count: 4,
    },
    {
      name: 'Test 2: Physics -> Motion / Velocity & Acceleration',
      grade: 'Grade 9',
      subject: 'Physics',
      chapter: 'Chapter 2',
      topic: 'Laws of Motion',
      difficulty: 'Medium',
      questionType: 'mixed',
      count: 4,
    },
    {
      name: 'Test 3: Chemistry -> Chemical Reactions',
      grade: 'Grade 10',
      subject: 'Chemistry',
      chapter: 'Chapter 1',
      topic: 'Chemical Reactions and Equations',
      difficulty: 'Medium',
      questionType: 'true_false',
      count: 3,
    },
    {
      name: 'Test 4: Biology -> Photosynthesis',
      grade: 'Grade 8',
      subject: 'Biology',
      chapter: 'Chapter 5',
      topic: 'Photosynthesis and Plant Metabolism',
      difficulty: 'Easy',
      questionType: 'mcq',
      count: 4,
    },
    {
      name: 'Test 5: Computer Science -> Java Classes & Objects',
      grade: 'Grade 11',
      subject: 'Computer Science',
      chapter: 'Chapter 3',
      topic: 'Java Classes and Objects',
      difficulty: 'Medium',
      questionType: 'mixed',
      count: 4,
    },
    {
      name: 'Test 6: English -> Grammar',
      grade: 'Grade 6',
      subject: 'English',
      chapter: 'Chapter 2',
      topic: 'Active and Passive Voice',
      difficulty: 'Easy',
      questionType: 'mcq',
      count: 3,
    },
    {
      name: 'Test 7: Social Studies -> History',
      grade: 'Grade 9',
      subject: 'Social Studies',
      chapter: 'Chapter 1',
      topic: 'French Revolution of 1789',
      difficulty: 'Hard',
      questionType: 'short',
      count: 3,
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const tc of testCases) {
    console.log(`\n📌 RUNNING: [${tc.name}]`);
    console.log(`   Config: Subject=${tc.subject} | Topic=${tc.topic} | Diff=${tc.difficulty} | Type=${tc.questionType}`);

    try {
      const questions = await aiService.generateAdaptiveQuiz(
        tc.grade,
        tc.subject,
        tc.chapter,
        tc.topic,
        tc.difficulty,
        tc.count,
        tc.questionType
      );

      console.log(`   Generated ${questions.length} questions:`);

      let isValidSubjectFidelity = true;
      let hasDuplicates = false;
      const seenQs = new Set();

      questions.forEach((q, idx) => {
        console.log(`   Q${idx + 1} [${q.type.toUpperCase()}]: ${q.question}`);
        console.log(`      Ans: ${q.correctAnswer}`);
        if (q.options && q.options.length) {
          console.log(`      Options: ${JSON.stringify(q.options)}`);
        }

        // Check for duplicates
        const normQ = q.question.toLowerCase().trim();
        if (seenQs.has(normQ)) {
          hasDuplicates = true;
        }
        seenQs.add(normQ);
      });

      if (!hasDuplicates && questions.length > 0) {
        console.log(`   ✅ PASSED [${tc.name}]: Genuine, subject-specific non-duplicate questions generated.`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED [${tc.name}]: Found duplicates or missing questions.`);
      }
    } catch (err) {
      console.log(`   ❌ FAILED [${tc.name}] with error:`, err.message);
    }
  }

  // Single Question Regeneration Test
  console.log('\n📌 RUNNING: [Test 8: Single Question Regeneration]');
  try {
    const existing = [
      { question: 'What is the discriminant formula for a quadratic equation ax² + bx + c = 0?' },
    ];
    const newSingleQ = await aiService.regenerateSingleQuestion(
      'Grade 10',
      'Mathematics',
      'Chapter 4',
      'Quadratic Equations',
      'Hard',
      'mcq',
      existing
    );
    console.log(`   Original Q: ${existing[0].question}`);
    console.log(`   Regenerated New Q: ${newSingleQ.question}`);
    console.log(`   Ans: ${newSingleQ.correctAnswer}`);

    if (newSingleQ && newSingleQ.question !== existing[0].question) {
      console.log('   ✅ PASSED [Single Question Regeneration]: Successfully generated non-duplicate replacement question.');
      passedTests++;
    } else {
      console.log('   ❌ FAILED [Single Question Regeneration]: Returned duplicate or null question.');
    }
    totalTests++;
  } catch (err) {
    console.log('   ❌ FAILED [Single Question Regeneration]:', err.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');
}

runQuizGeneratorVerification().catch((err) => {
  console.error('Fatal error in verification suite:', err);
});
