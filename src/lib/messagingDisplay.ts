/** Display name for inbound support replies in customer-facing chat. */
export const MOE_SUPPORT_LABEL = "MoE Support";

export function resolveMessageSenderName(
  msg: { senderRole?: string; senderType?: string },
  providerName: string,
  viewerIsCustomer: boolean,
): string {
  if (msg.senderRole === "admin" || msg.senderType === "provider") {
    return MOE_SUPPORT_LABEL;
  }
  if (msg.senderRole === "customer" || msg.senderType === "customer") {
    return viewerIsCustomer ? "You" : "Customer";
  }
  return providerName;
}

export function isAdminMessage(msg: { senderRole?: string; senderType?: string }): boolean {
  return msg.senderRole === "admin" || msg.senderType === "provider";
}
