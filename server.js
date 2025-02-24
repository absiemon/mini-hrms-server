require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 8000;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const dbConnection = require('./configs/db-config');
const authRoute = require('./routes/auth-route');
const adminRoute = require('./routes/admin-route');
const employeeRoute = require('./routes/employee-route');
const errorMiddleware = require('./middlewares/error-middleware');
const ErrorHandler = require('./utils/error-handler');
const { auth, authRole } = require('./middlewares/auth-middleware');
// Cron job for automatic payroll calculation 
require('./cronJob/generate-payroll.js');

const app = express();

// Database Connection
dbConnection();

const { CLIENT_URL } = process.env;

console.log(typeof CLIENT_URL)

//Cors Option
const corsOption = {
    credentials: true,
    origin: ['https://mini-hrms-qjod.onrender.com', 'https://mini-hrms-qjod.onrender.com/'],
    allowedHeaders: 'Content-Type, Authorization, Cookie, refresh-token'
}

//Configuration
app.use(cors(corsOption));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Routes


app.use('/api/auth', authRoute);
app.use('/api/admin', auth, authRole(['admin']), adminRoute);
app.use('/api/employee', auth, authRole(['employee']), employeeRoute);

app.use('/storage', express.static('storage'))

app.use('/', (req, res, next) => {
    res.json({ message: "Server running" })
});

//Middlewares;
app.use((req, res, next) => {
    return next(ErrorHandler.notFound('The Requested Resources Not Found'));
});

app.use(errorMiddleware)

app.listen(PORT, () => console.log(`Listening On Port : ${PORT}`));