import config from '../config.js'

export const adminRequired = async (req: any, reply: any) => {
  // If ADMIN_ROLE_ID is set, compare with roleId; otherwise, fall back to roleName check
  if (config.ADMIN_ROLE_ID !== undefined) {
    if (req.user?.roleId !== config.ADMIN_ROLE_ID) {
      return reply.code(403).send({ success: false, error: 'Admin role required' })
    }
  } else {
    // Fallback to role name check; expects roleName in req.user
    if (req.user?.roleName !== 'admin') {
      return reply.code(403).send({ success: false, error: 'Admin role required' })
    }
  }
}
