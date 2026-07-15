import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AGREEMENT_EDITOR_ROLES,
  assertAgreementTransition,
  canTransitionAgreement,
  isRoleAllowed,
} from "../lib/authorization-policy";

describe("agreement authorization policy", () => {
  it("allows admin and manager to edit agreements", () => {
    assert.equal(isRoleAllowed("admin", AGREEMENT_EDITOR_ROLES), true);
    assert.equal(isRoleAllowed("manager", AGREEMENT_EDITOR_ROLES), true);
  });

  it("does not allow inspector or viewer to edit agreements", () => {
    assert.equal(isRoleAllowed("inspector", AGREEMENT_EDITOR_ROLES), false);
    assert.equal(isRoleAllowed("viewer", AGREEMENT_EDITOR_ROLES), false);
  });
});

describe("agreement workflow policy", () => {
  it("allows the signing workflow to advance", () => {
    assert.equal(canTransitionAgreement("draft", "pending_signature"), true);
    assert.equal(canTransitionAgreement("pending_signature", "signed"), true);
  });

  it("rejects reversal and any transition from a terminated agreement", () => {
    assert.equal(canTransitionAgreement("signed", "pending_signature"), false);
    assert.equal(canTransitionAgreement("terminated", "draft"), false);
    assert.throws(
      () => assertAgreementTransition("terminated", "pending_signature"),
      /cannot transition/,
    );
  });
});
