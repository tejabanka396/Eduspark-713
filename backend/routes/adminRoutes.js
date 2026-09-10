const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getParents,
  createParent,
  updateParent,
  deleteParent,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/adminController');

// All routes require authenticated user with role 'admin'
router.use(protect);
router.use(authorize('admin'));

// Stats Route
router.get('/stats', getAdminStats);

// Teacher CRUD
router.route('/teachers').get(getTeachers).post(createTeacher);
router.route('/teachers/:id').put(updateTeacher).delete(deleteTeacher);

// Student CRUD
router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

// Parent CRUD
router.route('/parents').get(getParents).post(createParent);
router.route('/parents/:id').put(updateParent).delete(deleteParent);

// Class CRUD
router.route('/classes').get(getClasses).post(createClass);
router.route('/classes/:id').put(updateClass).delete(deleteClass);

// Subject CRUD
router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

module.exports = router;
