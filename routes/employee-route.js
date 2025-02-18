const router = require('express').Router();
const asyncMiddleware = require('../middlewares/async-middleware');
const userController = require('../controllers/user-controller');
const upload = require('../services/file-upload-service');

router.patch('/user', upload.single('profile'), asyncMiddleware(userController.updateUser));
router.post('/mark-employee-attendance', asyncMiddleware(userController.markEmployeeAttendance));
router.post('/view-employee-attendance', asyncMiddleware(userController.viewEmployeeAttendance));
router.get('/checkedIn-today', asyncMiddleware(userController.checkAttendanceStatus));

router.post('/apply-leave-application', asyncMiddleware(userController.applyLeaveApplication));
router.post('/view-leave-applications', asyncMiddleware(userController.viewLeaveApplications));
router.get('/view-payroll', asyncMiddleware(userController.getPayrollForEmployeePreviousMonth));

module.exports = router;