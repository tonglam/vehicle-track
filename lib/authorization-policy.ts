export const APPLICATION_ROLES = [
  "admin",
  "manager",
  "inspector",
  "viewer",
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

export const AGREEMENT_EDITOR_ROLES = [
  "admin",
  "manager",
] as const satisfies readonly ApplicationRole[];

export function isRoleAllowed(
  role: string,
  allowedRoles: readonly ApplicationRole[],
) {
  return allowedRoles.some((allowedRole) => allowedRole === role);
}

export const AGREEMENT_STATUSES = [
  "draft",
  "pending_signature",
  "signed",
  "terminated",
] as const;

export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

const agreementTransitions: Record<
  AgreementStatus,
  readonly AgreementStatus[]
> = {
  draft: ["pending_signature", "terminated"],
  pending_signature: ["signed", "terminated"],
  signed: ["terminated"],
  terminated: [],
};

export function canTransitionAgreement(
  currentStatus: AgreementStatus,
  nextStatus: AgreementStatus,
) {
  return agreementTransitions[currentStatus].includes(nextStatus);
}

export function assertAgreementTransition(
  currentStatus: AgreementStatus,
  nextStatus: AgreementStatus,
) {
  if (!canTransitionAgreement(currentStatus, nextStatus)) {
    throw new Error(
      `Agreement cannot transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}
