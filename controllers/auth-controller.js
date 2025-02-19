const validator = require('validator');
const ErrorHandler = require('../utils/error-handler');
const userService = require('../services/user-service');
const tokenService = require('../services/token-service');
const UserDto = require('../dtos/user-dto');

class AuthController {
    login = async (req, res, next) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(ErrorHandler.badRequest());
        }

        let data;
        if (validator.isEmail(email)) {
            data = { email };
        } else {
            data = { username: email };
        }

        const user = await userService.findUser(data);
        if (!user) {
            return next(ErrorHandler.badRequest('Invalid Email or Username'));
        }

        const {
            _id,
            name,
            username,
            email: dbEmail,
            password: hashPassword,
            type,
            status,
        } = user;
        if (status !== 'active') {
            return next(
                ErrorHandler.badRequest(
                    'There is a problem with your account, Please contact to the admin'
                )
            );
        }

        const isValid = await userService.verifyPassword(password, hashPassword);
        if (!isValid) {
            return next(ErrorHandler.badRequest('Invalid Password'));
        }

        const payload = {
            _id,
            email: dbEmail,
            username,
            type,
        };
        const { accessToken, refreshToken } = tokenService.generateToken(payload);
        console.log('Access Token', accessToken);
        console.log('Refresh Token', refreshToken);
        console.log('process.env.MODE', process.env.MODE);

        await tokenService.storeRefreshToken(_id, refreshToken);
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'None',
            secure: true ,
        });

        res.json({
            success: true,
            message: 'Login Successful',
            user: new UserDto(user),
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    };

    logout = async (req, res, next) => {
        const { refreshToken } = req.cookies;
        const { _id } = req.user;
        const response = await tokenService.removeRefreshToken(_id, refreshToken);
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');

        if (response.modifiedCount === 1) {
            return res.json({
                success: true,
                message: 'Logout Successfully',
            });
        } else {
            return next(ErrorHandler.unAuthorized());
        }
    };

    refresh = async (req, res, next) => {
        // const { refreshToken: refreshTokenFromCookie } = req.cookies;
        const refreshTokenFromCookie = req.headers['refresh-token']

        if (!refreshTokenFromCookie) {
            return next(ErrorHandler.unAuthorized());
        }

        const userData = await tokenService.verifyRefreshToken(refreshTokenFromCookie);

        const { _id, email, username, type } = userData;
        console.log("userData: " + _id, email, username, type)

        const token = await tokenService.findRefreshToken(_id, refreshTokenFromCookie);

        if (!token) {
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Access',
            });
        }

        const user = await userService.findUser({ email });
        if (user?.status !== 'active') {
            return next(
                ErrorHandler.unAuthorized(
                    'There is a problem with your account, Please contact to the admin'
                )
            );
        }

        const payload = {
            _id,
            email,
            username,
            type,
        };
        const { accessToken, refreshToken } = tokenService.generateToken(payload);
        await tokenService.updateRefreshToken(_id, refreshTokenFromCookie, refreshToken);

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: process.env.MODE === 'PRODUCTION' ? 'None' : 'Lax',
            secure: process.env.MODE === 'PRODUCTION' ? true : false,
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: process.env.MODE === 'PRODUCTION' ? 'None' : 'Lax',
            secure: process.env.MODE === 'PRODUCTION' ? true : false,
        });

        res.json({
            success: true,
            message: 'Secure access has been granted',
            user: new UserDto(user),
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    };
}

module.exports = new AuthController();
