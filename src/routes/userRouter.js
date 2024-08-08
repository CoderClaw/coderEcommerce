const { Router } = require('express');
const { getUsers, getUser, createUser, updateUser, deleteUser, changeUserRole } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getUsers);
router.get('/:uid', authenticateToken, authorizeRoles('admin'), getUser);
router.post('/', authenticateToken, authorizeRoles('admin'), createUser);
router.put('/:uid', authenticateToken, authorizeRoles('admin'), updateUser);
router.delete('/:uid', authenticateToken, authorizeRoles('admin'), deleteUser);
router.post('/premium/:uid', authenticateToken, authorizeRoles('admin'), changeUserRole); // Add change role route

module.exports = router;