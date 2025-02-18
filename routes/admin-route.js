const router = require('express').Router();
const userController = require('../controllers/user-controller');
const upload = require('../services/file-upload-service');
const asyncMiddleware = require('../middlewares/async-middleware');

router.post('/user', upload.single('profile'), asyncMiddleware(userController.createUser));
router.patch('/user/:id', upload.single('profile'), asyncMiddleware(userController.updateUser));
router.get('/employees', asyncMiddleware(userController.getUsers));
router.get('/employee/:id', asyncMiddleware(userController.getUser));
router.get('/user/:id', asyncMiddleware(userController.getUserNoFilter));
router.get('/admins', asyncMiddleware(userController.getUsers));
router.get('/admin/:id', asyncMiddleware(userController.getUser));
// Counts
router.get('/counts', asyncMiddleware(userController.getCounts));

router.post('/view-employee-attendance', asyncMiddleware(userController.viewEmployeeAttendance));
router.post('/view-leave-applications', asyncMiddleware(userController.viewLeaveApplications));
router.post('/assign-employee-salary', asyncMiddleware(userController.assignEmployeeSalary));
router.post('/update-employee-salary/', asyncMiddleware(userController.updateEmployeeSalary));
router.post('/view-all-salary', asyncMiddleware(userController.viewSalary));
router.post('/update-leave/:id', asyncMiddleware(userController.updateLeaveApplication));


module.exports = router;