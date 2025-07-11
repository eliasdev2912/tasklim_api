const jwt = require('jsonwebtoken');
const { sendError } = require('../utilities/errorsUtilities');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'MISSING_TOKEN', 'Token is required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ahora tenés los datos del user disponibles en `req.user`
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verifyToken;
