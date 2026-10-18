import { z } from "zod";
import { calendarDate } from "../calendar";
export function calendarDay(
  now = new Date(),
  timezone = process.env.APP_TIMEZONE || "Asia/Jakarta",
) {
  return calendarDate(now, timezone);
}
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return (
      Number.isFinite(d.getTime()) &&
      d.toISOString().slice(0, 10) === v &&
      v >= "1900-01-01"
    );
  }, "Invalid calendar date");
export const registrationInput = z.strictObject({
  name: text(2, 60),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  callbackURL: z.string().max(2048).optional(),
  rememberMe: z.boolean().optional(),
});
export const signInInput = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
  callbackURL: z.string().max(2048).optional(),
  rememberMe: z.boolean().optional(),
});
export const warrantyInput = z
  .strictObject({
    productName: text(2, 100),
    brand: text(2, 60),
    model: text(2, 60),
    category: z.enum(["electronics", "home", "other"]),
    serialNumber: text(3, 80),
    store: text(2, 100),
    purchaseDate: day,
    expiryDate: day,
    price: z.number().int().min(0).max(999999999999).optional(),
    notes: z.string().max(1000),
    receiptDemoAssetId: z.string().max(80).optional(),
  })
  .superRefine((v, c) => {
    if (v.purchaseDate > calendarDay())
      c.addIssue({
        code: "custom",
        path: ["purchaseDate"],
        message: "Purchase date is in the future",
      });
    if (v.expiryDate < v.purchaseDate)
      c.addIssue({
        code: "custom",
        path: ["expiryDate"],
        message: "Expiry precedes purchase",
      });
  });
export const catalogInput = z.strictObject({
  id: z.string().max(80).optional(),
  name: text(2, 100),
  brand: text(2, 60),
  model: text(2, 60),
  category: z.enum(["electronics", "home", "other"]),
  warrantyMonths: z.number().int().min(1).max(120),
  active: z.boolean(),
});
export const reviewInput = z
  .strictObject({
    expectedRevision: z.number().int().min(1).max(2147483647),
    status: z.enum(["pending", "approved", "rejected"]),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => v.status !== "rejected" || (v.note?.length || 0) >= 10,
    "Rejection needs a 10–500 character reason",
  );
export const profileInput = z.strictObject({
  name: text(2, 60),
  reminders: z.boolean(),
});
export const readInput = z.strictObject({ read: z.boolean() });
export const audienceInput = z.strictObject({
  audience: z.enum(["buyer", "admin"]),
});
export const scopeQuery = z.strictObject({
  scope: z.enum(["buyer", "admin"]).default("buyer"),
});
export const listQuery = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["active", "expiring", "expired"]).optional(),
  category: z.enum(["electronics", "home", "other"]).optional(),
  sort: z.enum(["newest", "expiry", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(6),
});
export const idInput = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/);
