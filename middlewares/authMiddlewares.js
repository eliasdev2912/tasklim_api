const jwt = require('jsonwebtoken');
const { BadRequestError, UnauthorizedError } = require('../src/utilities/errorsUtilities');
const userExistsById = require('../src/modules/users/validations/userExistsById.js');


function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new BadRequestError('Token is required'));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Token expired'));
      }
      return next(new UnauthorizedError('Invalid token'));
    }

    await userExistsById.error(decoded.id)
    req.user = decoded;
    next();
  });
}


module.exports = verifyToken;