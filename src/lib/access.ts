import type { Access, FieldAccess } from 'payload'

type MaybeUser = { id: string | number; role?: string } | null | undefined

export const isAdmin = (user: MaybeUser): boolean => user?.role === 'admin'

export const isAdminOrModerator = (user: MaybeUser): boolean =>
  user?.role === 'admin' || user?.role === 'moderator'

export const isLoggedIn = (user: MaybeUser): boolean => Boolean(user)

/** Access: anyone (including anonymous) can read. */
export const anyone: Access = () => true

/** Access: any authenticated user. */
export const authenticated: Access = ({ req: { user } }) =>
  isLoggedIn(user as MaybeUser)

/** Access: admins only. */
export const adminsOnly: Access = ({ req: { user } }) =>
  isAdmin(user as MaybeUser)

/** Access: admins and moderators. */
export const staffOnly: Access = ({ req: { user } }) =>
  isAdminOrModerator(user as MaybeUser)

/** Field-level access: admins only (e.g. for `role` field). */
export const adminFieldOnly: FieldAccess = ({ req: { user } }) =>
  isAdmin(user as MaybeUser)
