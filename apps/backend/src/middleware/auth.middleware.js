const { verifyToken } = require('../lib/jwt.lib');
const prisma = require('../lib/prisma');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, isDeleted: true },
    });

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: 'Unauthorized: Account has been deleted' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = authMiddleware;
