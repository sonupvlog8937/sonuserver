const STATUS_ALIASES = {
  confirm: "confirmed",
  confirmed: "confirmed",
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
  refunded: "refunded",
  assigned: "processing",
  "assigned to rider": "processing",
  "out for delivery": "out for delivery",
};

export const normalizeOrderStatus = (status) => {
  if (!status) return "pending";

  const normalized = String(status).toLowerCase().trim().replace(/_/g, " ");

  if (STATUS_ALIASES[normalized]) {
    return STATUS_ALIASES[normalized];
  }

  return normalized;
};

export default normalizeOrderStatus;
