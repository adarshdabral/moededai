export interface ResolvedIdentityDTO {
  userId: string;
  name: string;
  email: string;
  anonymousId: string;
}

export interface AuditLogDTO {
  id: string;
  actorAdminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: Date;
}
