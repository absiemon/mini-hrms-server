const UserModel = require('../models/user-model');
const PayrollModel = require('../models/payroll-model');
const LeaveModel = require('../models/leave-model');
const UserSalaryModel = require('../models/user-salary');
const bcrypt = require('bcrypt');

class UserService {

    createUser = async user => await UserModel.create(user);

    updateUser = async (_id, user) => await UserModel.updateOne({ _id }, user);

    findCount = async filter => await UserModel.find(filter).countDocuments();

    findUser = async filter => await UserModel.findOne(filter);

    findUsers = async filter => await UserModel.find(filter)

    verifyPassword = async (password, hashPassword) => await bcrypt.compare(password, hashPassword);

    createLeaveApplication = async data => LeaveModel.create(data);

    findLeaveApplication = async (data) => LeaveModel.findOne(data);

    findAllLeaveApplications = async (data) => LeaveModel.find(data);

    assignSalary = async (data) => UserSalaryModel.create(data);

    findSalary = async (data) => UserSalaryModel.findOne(data);

    findAllSalary = async (data) => UserSalaryModel.find(data);

    updateSalary = async (data, updatedSalary) => UserSalaryModel.findOneAndUpdate(data, updatedSalary);

    updateLeaveApplication = async (id, updatedLeave) => LeaveModel.findByIdAndUpdate(id, updatedLeave);

    getPayrollForEmployee = async (data) => PayrollModel.findOne(data);
}


module.exports = new UserService();