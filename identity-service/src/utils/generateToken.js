const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const generateToken =async(user) => {
    const accessToken = jwt.sign({
        userId:user?._id,
        username:user?.username,
    },process.env.JWTSECRET,{expiresIn:'2h'})

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate()+7);

    await RefreshToken.create({
        token:refreshToken,
        user:user?._id,
        expiresAt
    })

    return {accessToken,refreshToken}
}

module.exports = {generateToken};

