import { createHash } from "node:crypto";
import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
import { HttpError } from "./http";
import {
  calendarDay,
  warrantyInput,
  listQuery,
  catalogInput,
  reviewInput,
  profileInput,
} from "./validation";
import type { Warranty } from "../demo/types";
export type UserIdentity = {
  id: string;
  role?: string | null;
  name: string;
  email: string;
};
function admin(user: UserIdentity) {
  if (user.role !== "admin")
    throw new HttpError(403, "FORBIDDEN", "Administrator access is required.");
}
const include = { purchase: { include: { product: true } } } as const;
type Row = Prisma.WarrantyGetPayload<{ include: typeof include }>;
export function warrantyDTO(w: Row): Warranty {
  const p = w.purchase;
  return {
    id: w.id,
    revision: w.revision,
    productName: p.product.name,
    brand: p.product.brand,
    model: p.product.model,
    category: p.product.category,
    serialNumber: w.serialNumber,
    store: p.store,
    purchaseDate: p.purchaseDate.toISOString().slice(0, 10),
    expiryDate: w.expiryDate.toISOString().slice(0, 10),
    ...(p.price === null ? {} : { price: Number(p.price) }),
    notes: w.notes,
    reviewStatus: w.reviewStatus,
    ...(w.reviewNote ? { reviewNote: w.reviewNote } : {}),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
const date = (s: string) => new Date(s + "T00:00:00Z");
function dates() {
  const now = date(calendarDay());
  const end = new Date(now.getTime() + 30 * 86400000);
  return { now, end };
}
export async function getWarranty(user: UserIdentity, id: string) {
  const row = await db.warranty.findFirst({
    where: { id, ownerId: user.id },
    include,
  });
  if (!row) throw new HttpError(404, "NOT_FOUND", "Warranty not found.");
  return warrantyDTO(row);
}
export async function listWarranties(user: UserIdentity, query: unknown) {
  const q = listQuery.parse(query);
  const { now, end } = dates();
  const where: Prisma.WarrantyWhereInput = {
    ownerId: user.id,
    ...(q.category ? { purchase: { product: { category: q.category } } } : {}),
    ...(q.status
      ? {
          expiryDate:
            q.status === "expired"
              ? { lt: now }
              : q.status === "expiring"
                ? { gte: now, lte: end }
                : { gt: end },
        }
      : {}),
  };
  if (q.q)
    where.AND = [
      {
        OR: [
          { serialNumber: { contains: q.q, mode: "insensitive" } },
          {
            purchase: {
              product: {
                OR: [
                  { name: { contains: q.q, mode: "insensitive" } },
                  { brand: { contains: q.q, mode: "insensitive" } },
                  { model: { contains: q.q, mode: "insensitive" } },
                ],
              },
            },
          },
          { purchase: { store: { contains: q.q, mode: "insensitive" } } },
        ],
      },
    ];
  const orderBy: Prisma.WarrantyOrderByWithRelationInput[] =
    q.sort === "expiry"
      ? [{ expiryDate: "asc" }, { id: "asc" }]
      : q.sort === "name"
        ? [{ purchase: { product: { name: "asc" } } }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "desc" }];
  const [total, rows] = await db.$transaction([
    db.warranty.count({ where }),
    db.warranty.findMany({
      where,
      include,
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return {
    items: rows.map(warrantyDTO),
    total,
    page: q.page,
    pageSize: q.pageSize,
    pages: Math.ceil(total / q.pageSize),
  };
}
export async function saveWarranty(
  user: UserIdentity,
  raw: unknown,
  id?: string,
) {
  const v = warrantyInput.parse(raw);
  return db.$transaction(async (tx) => {
    const existing = id
      ? await tx.warranty.findFirst({ where: { id, ownerId: user.id } })
      : null;
    if (id && !existing)
      throw new HttpError(404, "NOT_FOUND", "Warranty not found.");
    const fingerprint = createHash("sha256")
      .update(JSON.stringify([v.productName, v.brand, v.model, v.category]))
      .digest("hex");
    const product = await tx.product.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        name: v.productName,
        brand: v.brand,
        model: v.model,
        category: v.category,
      },
      update: {},
    });
    const purchaseData = {
      productId: product.id,
      store: v.store,
      purchaseDate: date(v.purchaseDate),
      price: v.price === undefined ? null : BigInt(v.price),
    };
    const purchase = existing
      ? await tx.purchase.update({
          where: { id: existing.purchaseId },
          data: purchaseData,
        })
      : await tx.purchase.create({
          data: { ...purchaseData, ownerId: user.id },
        });
    const data = {
      serialNumber: v.serialNumber,
      serialKey: v.serialNumber.toLowerCase(),
      expiryDate: date(v.expiryDate),
      notes: v.notes,
      reviewStatus: "pending" as const,
      reviewNote: null,
    };
    const row = existing
      ? await tx.warranty.update({
          where: { id: existing.id },
          data: { ...data, revision: { increment: 1 } },
          include,
        })
      : await tx.warranty.create({
          data: { ...data, ownerId: user.id, purchaseId: purchase.id },
          include,
        });
    const admins = await tx.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });
    if (admins.length)
      await tx.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          audience: "admin",
          title: "Garansi menunggu tinjauan",
          body: `${v.productName} ${id ? "diperbarui" : "ditambahkan"}.`,
          href: `/admin/reviews/${row.id}`,
        })),
      });
    return warrantyDTO(row);
  });
}
export async function removeWarranty(user: UserIdentity, id: string) {
  return db.$transaction(async (tx) => {
    const row = await tx.warranty.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!row) throw new HttpError(404, "NOT_FOUND", "Warranty not found.");
    await tx.purchase.delete({ where: { id: row.purchaseId } });
    return { id };
  });
}
export async function upsertCatalog(user: UserIdentity, raw: unknown) {
  admin(user);
  const v = catalogInput.parse(raw);
  const { id, ...data } = v;
  const key = JSON.stringify([v.brand.toLowerCase(), v.model.toLowerCase()]);
  if (id)
    return db.catalogProduct.update({
      where: { id },
      data: { ...data, brandModelKey: key },
    });
  return db.catalogProduct.create({ data: { ...data, brandModelKey: key } });
}
export async function reviewWarranty(
  user: UserIdentity,
  id: string,
  raw: unknown,
) {
  admin(user);
  const v = reviewInput.parse(raw);
  return db.$transaction(async (tx) => {
    const old = await tx.warranty.findUnique({ where: { id }, include });
    if (!old) throw new HttpError(404, "NOT_FOUND", "Warranty not found.");
    const updated = await tx.warranty.updateMany({
      where: { id, revision: v.expectedRevision },
      data: {
        reviewStatus: v.status,
        reviewNote: v.note || null,
        revision: { increment: 1 },
      },
    });
    if (updated.count !== 1)
      throw new HttpError(
        409,
        "REVISION_CONFLICT",
        "Garansi telah berubah. Muat ulang dan tinjau detail terbaru sebelum menyimpan keputusan.",
      );
    const row = await tx.warranty.findUniqueOrThrow({ where: { id }, include });
    const label =
      v.status === "approved"
        ? "disetujui"
        : v.status === "rejected"
          ? "ditolak"
          : "dikembalikan ke antrean";
    await tx.notification.create({
      data: {
        userId: row.ownerId,
        audience: "buyer",
        title: `Tinjauan ${label}`,
        body: `${row.purchase.product.name}: ${v.note || "Status tinjauan diperbarui."}`,
        href: `/app/warranties/${id}`,
      },
    });
    await tx.reviewActivity.create({
      data: {
        actorId: user.id,
        ownerId: row.ownerId,
        warrantyId: id,
        status: v.status,
        note: v.note,
        text: `${row.purchase.product.name} ${label}`,
      },
    });
    return warrantyDTO(row);
  });
}
export async function stats(user: UserIdentity, scope: "buyer" | "admin") {
  if (scope === "admin") admin(user);
  const where = scope === "admin" ? {} : { ownerId: user.id };
  const { now, end } = dates();
  const [total, active, expiring, expired, catalog, pending, approved] =
    await db.$transaction([
      db.warranty.count({ where }),
      db.warranty.count({ where: { ...where, expiryDate: { gt: end } } }),
      db.warranty.count({
        where: { ...where, expiryDate: { gte: now, lte: end } },
      }),
      db.warranty.count({ where: { ...where, expiryDate: { lt: now } } }),
      db.catalogProduct.count({
        where: scope === "admin" ? {} : { active: true },
      }),
      db.warranty.count({ where: { ...where, reviewStatus: "pending" } }),
      db.warranty.count({ where: { ...where, reviewStatus: "approved" } }),
    ]);
  return { total, active, expiring, expired, catalog, pending, approved };
}
async function reminders(user: UserIdentity) {
  const settings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });
  if (settings?.reminders === false) return;
  const { now, end } = dates();
  const rows = await db.warranty.findMany({
    where: { ownerId: user.id, expiryDate: { gte: now, lte: end } },
    include,
  });
  for (const row of rows) {
    const dedupeKey = `reminder:${row.id}:${row.expiryDate.toISOString().slice(0, 10)}`;
    await db.notification.upsert({
      where: { dedupeKey },
      update: {},
      create: {
        dedupeKey,
        userId: user.id,
        audience: "buyer",
        title: "Masa garansi segera berakhir",
        body: `Periksa masa berlaku ${row.purchase.product.name}.`,
        href: `/app/warranties/${row.id}`,
      },
    });
  }
}
export async function workspace(user: UserIdentity, scope: "buyer" | "admin") {
  if (scope === "admin") admin(user);
  if (scope === "buyer") await reminders(user);
  const [rows, catalog, notifications, settings, activity, counts] =
    await Promise.all([
      db.warranty.findMany({
        where: scope === "admin" ? {} : { ownerId: user.id },
        include,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      db.catalogProduct.findMany({
        where: scope === "admin" ? {} : { active: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
      db.notification.findMany({
        where: { userId: user.id, audience: scope },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      db.userSettings.findUnique({ where: { userId: user.id } }),
      db.reviewActivity.findMany({
        where: scope === "admin" ? {} : { ownerId: user.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
      }),
      stats(user, scope),
    ]);
  return {
    version: 1,
    calendar: { timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta" },
    warranties: rows.map(warrantyDTO),
    catalog: catalog.map(
      ({ id, name, brand, model, category, warrantyMonths, active }) => ({
        id,
        name,
        brand,
        model,
        category,
        warrantyMonths,
        active,
      }),
    ),
    notifications: notifications.map(
      ({ id, audience, title, body, createdAt, readAt, href }) => ({
        id,
        audience,
        title,
        body,
        createdAt: createdAt.toISOString(),
        ...(readAt ? { readAt: readAt.toISOString() } : {}),
        ...(href ? { href } : {}),
      }),
    ),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "buyer",
      reminders: settings?.reminders ?? true,
    },
    activity: activity.map((a) => ({
      id: a.id,
      text: a.text,
      date: a.createdAt.toISOString(),
    })),
    stats: counts,
  };
}
export async function updateProfile(user: UserIdentity, raw: unknown) {
  const v = profileInput.parse(raw);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name: v.name } }),
    db.userSettings.upsert({
      where: { userId: user.id },
      update: { reminders: v.reminders },
      create: { userId: user.id, reminders: v.reminders },
    }),
  ]);
  return { ...v, email: user.email, role: user.role || "buyer" };
}
export async function markNotification(
  user: UserIdentity,
  id: string,
  read: boolean,
) {
  const row = await db.notification.findFirst({
    where: {
      id,
      userId: user.id,
      ...(user.role !== "admin" ? { audience: "buyer" as const } : {}),
    },
  });
  if (!row) throw new HttpError(404, "NOT_FOUND", "Notification not found.");
  await db.notification.update({
    where: { id: row.id },
    data: { readAt: read ? new Date() : null },
  });
  return { id, read };
}
export async function markAllNotifications(
  user: UserIdentity,
  audience: "buyer" | "admin",
) {
  if (audience === "admin") admin(user);
  const result = await db.notification.updateMany({
    where: { userId: user.id, audience, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
