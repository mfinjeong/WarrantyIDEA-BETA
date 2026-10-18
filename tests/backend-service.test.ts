import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { isolatedDatabaseTestSkip } from "../src/lib/server/test-safety";
const skip = isolatedDatabaseTestSkip();

test("stale admin review revisions conflict without decision or side effects", { skip }, async () => {
  const { db } = await import("../src/lib/server/db");
  const { saveWarranty, getWarranty, reviewWarranty, workspace } = await import("../src/lib/server/service");
  try {
    const buyer = await db.user.create({ data: { id: randomUUID(), name: "Revision buyer", email: `${randomUUID()}@example.com` } });
    const admin = await db.user.create({ data: { id: randomUUID(), name: "Revision admin", email: `${randomUUID()}@example.com`, role: "admin" } });
    const otherAdmin = await db.user.create({ data: { id: randomUUID(), name: "Other revision admin", email: `${randomUUID()}@example.com`, role: "admin" } });
    const input = { productName: "Revision phone", brand: "Brand", model: "Model", category: "electronics" as const, serialNumber: randomUUID(), store: "Shop", purchaseDate: "2024-01-01", expiryDate: "2099-01-01", notes: "Original details" };
    const created = await saveWarranty(buyer, input);
    const observed = (await workspace(admin, "admin")).warranties.find(w => w.id === created.id)!;
    assert.equal(observed.revision, 1, "real server DTO must expose the initial revision");
    const edited = await saveWarranty(buyer, { ...input, notes: "Buyer corrected details" }, created.id);
    assert.equal(edited.revision, 2);
    const effects = async () => ({
      notifications: await db.notification.count({ where: { href: { in: [`/app/warranties/${created.id}`, `/admin/reviews/${created.id}`] } } }),
      activities: await db.reviewActivity.count({ where: { warrantyId: created.id } }),
    });
    const before = await effects();
    await assert.rejects(reviewWarranty(admin, created.id, { status: "approved", expectedRevision: observed.revision }), { status: 409, code: "REVISION_CONFLICT" });
    assert.deepEqual(await getWarranty(buyer, created.id), edited);
    assert.deepEqual(await effects(), before, "conflict must not emit notifications or audit activity");
    const fresh = (await workspace(otherAdmin, "admin")).warranties.find(w => w.id === created.id)!;
    for (const invalid of [undefined, 0, -1, 1.5, "2", null]) {
      await assert.rejects(reviewWarranty(admin, created.id, { status: "approved", expectedRevision: invalid }));
    }
    await assert.rejects(reviewWarranty(admin, created.id, { status: "approved", expectedRevision: fresh.revision, unexpected: true }));
    assert.deepEqual(await effects(), before);
    const reviewed = await reviewWarranty(admin, created.id, { status: "approved", expectedRevision: fresh.revision });
    assert.equal(reviewed.reviewStatus, "approved");
    assert.equal(reviewed.revision, 3);
    const after = await effects();
    assert.deepEqual(after, { notifications: before.notifications + 1, activities: before.activities + 1 });
    await assert.rejects(reviewWarranty(otherAdmin, created.id, { status: "rejected", note: "Outdated administrator decision", expectedRevision: fresh.revision }), { status: 409, code: "REVISION_CONFLICT" });
    assert.deepEqual(await getWarranty(buyer, created.id), reviewed);
    assert.deepEqual(await effects(), after);
    // Retain generated users, warranties, notifications and audit evidence.
  } finally {
    await db.$disconnect();
  }
});

test(
  "persistent warranty isolation, aggregates, review audit and notifications",
  { skip },
  async () => {
    const { db } = await import("../src/lib/server/db");
    const {
      saveWarranty,
      getWarranty,
      listWarranties,
      reviewWarranty,
      workspace,
      removeWarranty,
    } = await import("../src/lib/server/service");
    const buyer = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Buyer A",
        email: `${randomUUID()}@example.com`,
      },
    });
    const other = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Buyer B",
        email: `${randomUUID()}@example.com`,
      },
    });
    const admin = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Admin",
        email: `${randomUUID()}@example.com`,
        role: "admin",
      },
    });
    try {
      const input = {
        productName: "Phone",
        brand: "Brand",
        model: "Model",
        category: "electronics" as const,
        serialNumber: "ABC-123",
        store: "Shop",
        purchaseDate: "2024-01-01",
        expiryDate: "2099-01-01",
        notes: "",
        price: 123456789012,
      };
      const created = await saveWarranty(buyer, input);
      assert.equal(created.productName, "Phone");
      assert.equal(created.price, input.price);
      assert.equal((await listWarranties(other, {})).total, 0);
      await assert.rejects(getWarranty(other, created.id), { status: 404 });
      await assert.rejects(saveWarranty(other, input, created.id), {
        status: 404,
      });
      await assert.rejects(removeWarranty(other, created.id), { status: 404 });
      await assert.rejects(
        reviewWarranty(buyer, created.id, { status: "approved" }),
        { status: 403 },
      );
      const reviewed = await reviewWarranty(admin, created.id, {
        status: "approved",
        expectedRevision: created.revision,
      });
      assert.equal(reviewed.reviewStatus, "approved");
      const snapshot = await workspace(buyer, "buyer");
      assert.equal(snapshot.stats.total, 1);
      assert.equal(snapshot.stats.approved, 1);
      assert.equal(snapshot.notifications.length, 1);
      assert.equal(snapshot.activity.length, 1);
      await assert.rejects(workspace(buyer, "admin"), { status: 403 });
      await removeWarranty(buyer, created.id);
      assert.equal((await listWarranties(buyer, {})).total, 0);
    } finally {
      // Retain generated fixtures/audit evidence; no bulk cleanup.
      await db.$disconnect();
    }
  },
);
