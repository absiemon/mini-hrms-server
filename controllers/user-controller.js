const ErrorHandler = require('../utils/error-handler');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');
const mongoose = require('mongoose');
const crypto = require('crypto');
const attendanceService = require('../services/attendance-service');

class UserController {
    createUser = async (req, res, next) => {
        const file = req.file;
        let { name, email, password, type, address, mobile, aadharNo, panNo, bankAccountNo, ifscCode } = req.body;
        const username = 'user' + crypto.randomInt(11111111, 999999999);

        if (!name || !email || !username || !password || !type || !address || !file || !mobile || !aadharNo || !panNo || !bankAccountNo || !ifscCode) {
            return next(ErrorHandler.badRequest('All Fields Required'));
        }
        type = type.toLowerCase();
        if (type === 'admin') {
            const adminPassword = req.body.adminPassword;
            if (!adminPassword) {
                return next(ErrorHandler.badRequest(`Please Enter Your Password to Add ${name} as an Admin`));
            }
            const { _id } = req.user;
            const { password: hashPassword } = await userService.findUser({ _id });
            const isPasswordValid = await userService.verifyPassword(adminPassword, hashPassword);
            if (!isPasswordValid) {
                return next(ErrorHandler.unAuthorized('You have entered a wrong password'));
            }
        }
        const user = {
            name,
            email,
            username,
            mobile,
            password,
            type,
            address,
            image: file.filename,
            aadharNo,
            panNo,
            bankAccountNo,
            ifscCode
        };

        const userResp = await userService.createUser(user);
        if (!userResp) {
            return next(ErrorHandler.serverError('Failed To Create An Account'));
        }
        res.json({ success: true, message: 'User has been Added', user: new UserDto(user) });
    };

    updateUser = async (req, res, next) => {
        const file = req.file;
        const filename = file && file.filename;
        let user, id;
        if (req.user.type === 'admin') {
            const { id: paramId } = req.params;
            let { name, username, email, password, type, status, address, mobile } = req.body;
            type = type && type.toLowerCase();
            if (!mongoose.Types.ObjectId.isValid(paramId)) {
                return next(ErrorHandler.badRequest('Invalid User Id'));
            }
            if (type) {
                const dbUser = await userService.findUser({ _id: paramId });
                if (!dbUser) {
                    return next(ErrorHandler.badRequest('No User Found'));
                }
                if (dbUser.type != type) {
                    const { _id } = req.user;
                    if (_id === paramId) {
                        return next(ErrorHandler.badRequest(`You Can't Change Your Own Position`));
                    }
                    const { adminPassword } = req.body;
                    if (!adminPassword) {
                        return next(ErrorHandler.badRequest(`Please Enter Your Password To Change The Type`));
                    }
                    const { password: hashPassword } = await userService.findUser({ _id });
                    const isPasswordValid = await userService.verifyPassword(adminPassword, hashPassword);
                    if (!isPasswordValid) {
                        return next(ErrorHandler.unAuthorized('You have entered a wrong password'));
                    }
                }
            }
            user = {
                name,
                email,
                status,
                username,
                mobile,
                password,
                type,
                address,
                image: filename,
            };
            id = paramId;
        } else {
            id = req.user._id;
            let { name, username, address, mobile } = req.body;
            user = {
                name,
                username,
                mobile,
                address,
                image: filename,
            };
        }
        const userResp = await userService.updateUser(id, user);
        if (!userResp) {
            return next(ErrorHandler.serverError('Failed To Update Account'));
        }
        res.json({ success: true, message: 'Account Updated' });
    };

    getUsers = async (req, res, next) => {
        const type = req.path.split('/').pop().replace('s', '');
        const emps = await userService.findUsers({ type });

        const employees = emps.map((o) => new UserDto(o));
        res.json({
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1).replace(' ', '')} List Found`,
            data: employees,
        });
    };

    getFreeEmployees = async (req, res, next) => {
        const emps = await userService.findUsers({ type: 'employee' });
        if (!emps || emps.length < 1) {
            return next(ErrorHandler.notFound('No Free Employee Found'));
        }
        const employees = emps.map((o) => new UserDto(o));
        res.json({
            success: true,
            message: 'Free Employees List Found',
            data: employees,
        });
    };

    getUser = async (req, res, next) => {
        const { id } = req.params;
        const type = req.path.replace(id, '').replace('/', '').replace('/', '');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(
                ErrorHandler.badRequest(
                    `Invalid ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ', '')} Id`
                )
            );
        }
        const emp = await userService.findUser({ _id: id, type });
        if (!emp) {
            return next(
                ErrorHandler.notFound(
                    `No ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ', '')} Found`
                )
            );
        }
        res.json({ success: true, message: 'Employee Found', data: new UserDto(emp) });
    };

    getUserNoFilter = async (req, res, next) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(ErrorHandler.badRequest('Invalid User Id'));
        }
        const emp = await userService.findUser({ _id: id });
        if (!emp) {
            return next(ErrorHandler.notFound('No User Found'));
        }
        res.json({ success: true, message: 'User Found', data: new UserDto(emp) });
    };


    markEmployeeAttendance = async (req, res, next) => {
        try {
            const { employeeID } = req.body;
            const days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            const currentTime = new Date();

            // Working hours (for example: 9 AM to 7 PM)
            const WORK_START_HOUR = 9; // 9:00 AM
            const WORK_END_HOUR = 19;  // 7:00 PM
            const currentHour = currentTime.getHours();

            if (currentHour < WORK_START_HOUR || currentHour >= WORK_END_HOUR) {
                return next(ErrorHandler.notAllowed("Attendance is only allowed during working hours 9AM to 6 PM."));
            }

            const query = {
                employeeID,
                year: currentTime.getFullYear(),
                month: currentTime.getMonth() + 1,
                date: currentTime.getDate(),
            };

            // Check if an attendance record for today already exists
            let attendanceRecord = await attendanceService.findAttendance(query);

            if (!attendanceRecord) {
                // No record exists: create one as a Check-In
                const newAttendance = {
                    ...query,
                    day: days[currentTime.getDay()],
                    present: true,
                    checkIn: currentTime,
                    checkOut: null,
                };
                const resp = await attendanceService.markAttendance(newAttendance);
                if (!resp) {
                    return next(ErrorHandler.serverError('Failed to mark attendance (check-in)'));
                }
                const msg = `Check-In successful at ${currentTime.toLocaleTimeString()}`;
                return res.json({ success: true, attendance: newAttendance, message: msg, checkedIn: true, checkedOut: false });
            }
            else {
                //check if Check-Out is already marked
                if (attendanceRecord.checkOut) {
                    return next(ErrorHandler.notAllowed("Attendance already marked for today."));
                }
                // Update the record with the current time as Check-Out
                const updatedRecord = await attendanceService.updateAttendance(
                    attendanceRecord._id,
                    { checkOut: currentTime }
                );
                if (!updatedRecord) {
                    return next(ErrorHandler.serverError('Failed to mark check-out'));
                }
                const msg = `Check-Out successful at ${currentTime.toLocaleTimeString()}`;
                return res.json({ success: true, attendance: updatedRecord, message: msg, checkedIn: false, checkedOut: true });
            }
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    //function to check if the user has already checked in today
    checkAttendanceStatus = async (req, res, next) => {
        try {
            const employeeID = req.user._id
            const currentTime = new Date();
            const query = {
                employeeID,
                year: currentTime.getFullYear(),
                month: currentTime.getMonth() + 1,
                date: currentTime.getDate(),
            };

            const attendanceRecord = await attendanceService.findAttendance(query);

            // Return checkedIn true if a check-in time exists; otherwise, false
            if (attendanceRecord && attendanceRecord.checkIn) {
                return res.json({ checkedIn: true });
            }
            else {
                return res.json({ checkedIn: false });
            }
        }
        catch (error) {
            return res.json({ success: false, error: error.message });
        }
    };


    viewEmployeeAttendance = async (req, res, next) => {
        try {
            const data = req.body;
            const resp = await attendanceService.findAllAttendance(data);
            if (!resp) {
                return next(ErrorHandler.notFound('No Attendance found'));
            }
            res.json({ success: true, data: resp });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    applyLeaveApplication = async (req, res, next) => {
        try {
            const data = req.body;
            const { applicantID, title, type, startDate, endDate, appliedDate, period, reason } = data;
            const newLeaveApplication = {
                applicantID,
                title,
                type,
                startDate,
                endDate,
                appliedDate,
                period,
                reason,
                adminResponse: "Pending",
            };

            const isLeaveApplied = await userService.findLeaveApplication({
                applicantID,
                startDate,
                endDate,
                appliedDate,
            });
            if (isLeaveApplied) {
                return next(ErrorHandler.notAllowed('Leave Already Applied'));
            }

            const resp = await userService.createLeaveApplication(newLeaveApplication);
            if (!resp) {
                return next(ErrorHandler.serverError('Failed to apply leave'));
            }
            res.json({ success: true, data: resp });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    viewLeaveApplications = async (req, res, next) => {
        try {
            const data = req.body;
            const resp = await userService.findAllLeaveApplications(data);
            if (!resp) {
                return next(ErrorHandler.notFound('No Leave Applications found'));
            }
            res.json({ success: true, data: resp });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    updateLeaveApplication = async (req, res, next) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const isLeaveUpdated = await userService.updateLeaveApplication(id, body);
            if (!isLeaveUpdated) {
                return next(ErrorHandler.serverError('Failed to update leave'));
            }
            res.json({ success: true, message: 'Leave Updated' });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    assignEmployeeSalary = async (req, res, next) => {
        try {
            const data = req.body;
            const obj = {
                employeeID: data.employeeID,
            };
            const isSalaryAssigned = await userService.findSalary(obj);
            if (isSalaryAssigned) {
                return next(ErrorHandler.serverError('Salary already assigned'));
            }

            const d = new Date();
            data["assignedDate"] =
                d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            const resp = await userService.assignSalary(data);
            if (!resp) {
                return next(ErrorHandler.serverError('Failed to assign salary'));
            }
            res.json({ success: true, data: resp });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    updateEmployeeSalary = async (req, res, next) => {
        try {
            const body = req.body;
            const { employeeID } = body;
            const d = new Date();
            body["assignedDate"] =
                d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            const isSalaryUpdated = await userService.updateSalary({ employeeID }, body);

            if (!isSalaryUpdated) {
                return next(ErrorHandler.serverError('Failed to update salary'));
            }
            res.json({ success: true, message: 'Salary Updated' });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    viewSalary = async (req, res, next) => {
        try {
            const data = req.body;
            const resp = await userService.findAllSalary(data);
            if (!resp) {
                return next(ErrorHandler.notFound('No Salary Found'));
            }
            res.json({ success: true, data: resp });
        }
        catch (error) {
            res.json({ success: false, error });
        }
    };

    getPayrollForEmployeePreviousMonth = async (req, res, next) => {
        try {
            const employeeID = req.user._id

            //previous month in "YYYY-MM" format
            const now = new Date();
            let month = now.getMonth();
            let year = now.getFullYear();
            if (month === 0) {
                month = 12;
                year = year - 1;
            }
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

            //  payroll record for the employee for the computed month
            const payrollRecord = await userService.getPayrollForEmployee({ employeeID: employeeID, month: monthStr })
            res.json({ success: true, data: payrollRecord });
        }
        catch (error) {
            res.json({ success: false, error: error.message });
        }
    };

    getCounts = async (req, res, next) => {
        const admin = await userService.findCount({ type: 'admin' });
        const employee = await userService.findCount({ type: 'employee' });
        const data = {
            admin,
            employee,
        }
        res.json({ success: true, message: 'Counts Found', data })
    }
}

module.exports = new UserController();
