export type ReviewStatus = "pending" | "approved" | "rejected";
export type WarrantyStatus = "active" | "expiring" | "expired";
export type Category = "electronics" | "home" | "other";
export type Warranty = {
  id: string;
  productName: string;
  brand: string;
  model: string;
  category: Category;
  serialNumber: string;
  store: string;
  purchaseDate: string;
  expiryDate: string;
  price?: number;
  notes: string;
  reviewStatus: ReviewStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  receiptDemoAssetId?: string;
};
export type WarrantyInput = Omit<
  Warranty,
  "id" | "createdAt" | "updatedAt" | "reviewStatus" | "reviewNote"
>;
export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: Category;
  warrantyMonths: number;
  active: boolean;
};
export type DemoNotification = {
  id: string;
  audience: "buyer" | "admin";
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  href?: string;
};
export type DemoState = {
  version: 1;
  warranties: Warranty[];
  catalog: CatalogProduct[];
  notifications: DemoNotification[];
  profile: { name: string; reminders: boolean };
  activity: { id: string; text: string; date: string }[];
};
export type Receipt = { url: string; name: string; size: number };
/** Adapter boundary for a future data source. The current implementation stays in the browser. */
export interface DemoRepository {
  listWarranties(): Promise<Warranty[]>;
  getWarranty(id: string): Promise<Warranty | undefined>;
  listCatalog(): Promise<CatalogProduct[]>;
  createWarranty(input: WarrantyInput): Promise<string>;
  updateWarranty(id: string, input: WarrantyInput): Promise<string>;
  removeWarranty(id: string): Promise<void>;
  upsertCatalog(product: CatalogProduct): Promise<void>;
  review(id: string, status: ReviewStatus, note?: string): Promise<void>;
  markRead(id: string, read: boolean): Promise<void>;
  markAllRead(audience: "buyer" | "admin"): Promise<void>;
  updateProfile(name: string, reminders: boolean): Promise<void>;
  reset(): Promise<void>;
}
export const categories: Record<Category, string> = {
  electronics: "Elektronik",
  home: "Rumah tangga",
  other: "Lainnya",
};
