const cron = require('node-cron');
const Payroll = require('../models/payroll-model.js');
const UserSalary = require('../models/user-salary.js');
const Attendance = require('../models/attendance-model.js');

//function to calculate total working days for a given month and year
const getTotalWorkingDays = (month, year) => {
    const totalDays = new Date(year, month, 0).getDate(); // month is 1-indexed
    let workingDays = 0;
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day); // JS month is 0-indexed
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
    }
    return workingDays;
};

// Function to generate payroll for all employees for the previous month
const generatePayroll = async () => {
    try {

        const now = new Date();
        let month = now.getMonth(); // returns 0 for January, so previous month is current month index
        let year = now.getFullYear();
        // If current month is January, previous month is December of last year
        if (month === 0) {
            month = 12;
            year = year - 1;
        }

        // total working days for the previous month
        const totalWorkingDays = getTotalWorkingDays(month, year);

        const salaryRecords = await UserSalary.find({});

        for (const record of salaryRecords) {
            const employeeID = record.employeeID;
            const baseSalary = record.salary;

            // Counting attendance records (with a valid checkIn) for the employee for the previous month
            const daysPresent = await Attendance.countDocuments({
                employeeID,
                year: year,
                month: month,
                checkIn: { $ne: null }
            });

            // final salary
            const finalSalary = (baseSalary / totalWorkingDays) * daysPresent;

            // Create and store the payroll record
            const payroll = new Payroll({
                employeeID,
                month: `${year}-${month.toString().padStart(2, '0')}`,
                baseSalary,
                totalWorkingDays,
                daysPresent,
                finalSalary,
                bonus: record.bonus || 0,
                deductions: 0,
            });

            await payroll.save();
            console.log(`Payroll generated for employee ${employeeID}`);
        }
    }
    catch (error) {
        console.error('Error generating payroll:', error);
    }
};

// Cron job to run at 12:00 AM on the first day of each month
cron.schedule('0 0 0 1 * *', () => {
    console.log('Cron Job: Generating monthly payroll...');
    generatePayroll();
});
