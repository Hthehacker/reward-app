import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get list of all users (admin only).
 * Supports optional pagination via query params `page` and `limit`.
 */
export const adminGetUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || req.query.q || '').trim();

    const query = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { email: regex }, { userId: regex }];
    }

    const users = await User.find(query)
      .select('-password -refreshTokenHash')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await User.countDocuments(query);

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'ADMIN_GET_USERS',
      result: 'SUCCESS',
      metadata: { page, limit, total, search }
    });

    res.json({
      success: true,
      data: { users, pagination: { page, limit, total } }
    });
  } catch (err) {
    next(err);
  }
};
