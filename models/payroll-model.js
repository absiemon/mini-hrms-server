const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PayrollSchema = new Schema({
    employeeID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // Format "YYYY-MM"
    baseSalary: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    daysPresent: { type: Number, required: true },
    finalSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 }
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Payroll', PayrollSchema, 'payroll');
