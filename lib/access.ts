/* A user can access a farm if they own it OR are a team member. These small
   `where` fragments keep that rule in one place across every route. */

export function farmAccessWhere(userId: string) {
  return { OR: [{ userId }, { members: { some: { userId } } }] };
}

export function fieldAccessWhere(userId: string) {
  return { farm: farmAccessWhere(userId) };
}
