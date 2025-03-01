const logger = require('../utils/logger');
const { validateRegistration, validatelogin } = require('../utils/Validation.js');
const User = require('../models/User.js');
const { generateToken } = require('../utils/generateToken.js');
const RefreshToken = require('../models/RefreshToken.js')

// user registration
const registerUser = async (req, res) => {
    logger.info("Registration end points hit...")
    try {
        // validate the schema..
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error", error?.details[0]?.message)
            return res.status(400).json({
                success: false,
                message: error?.details[0]?.message,
            })
        }

        const { email, password, username } = req.body;
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exist")
            return res.status(400).json({
                status: false,
                message: "User already exist"
            })
        }
        user = new User({ email, password, username });
        await user.save();
        logger.warn("User saved successfully", user?._id);
        const { accessToken, refreshToken } = await generateToken(user);

        res.status(201).json({
            sucess: true,
            message: "User created successfully",
            accessToken,
            refreshToken
        })

    } catch (error) {
        logger.error("Registration error occured..")
        res.status(500).json({
            success: false,
            message: "Intenal Server Error"
        })
    }
}


//Login user
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("Invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // user valid password or not
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn("Invalid password");
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }

        const { accessToken, refreshToken } = await generateToken(user);

        res.json({
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (e) {
        logger.error("Login error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


//refresh token
const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn("Invalid or expired refresh token");

            return res.status(401).json({
                success: false,
                message: `Invalid or expired refresh token`,
            });
        }

        const user = await User.findById(storedToken.user);

        if (!user) {
            logger.warn("User not found");

            return res.status(401).json({
                success: false,
                message: `User not found`,
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await generateTokens(user);

        //delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (e) {
        logger.error("Refresh token error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//logout

const logoutUser = async (req, res) => {
    logger.info("Logout endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info("Refresh token deleted for logout");

        res.json({
            success: true,
            message: "Logged out successfully!",
        });
    } catch (e) {
        logger.error("Error while logging out", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = { registerUser, loginUser, refreshTokenUser ,logoutUser}