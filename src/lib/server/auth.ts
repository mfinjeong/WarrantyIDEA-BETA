import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { hash, verify } from "@node-rs/argon2";
import { db } from "./db";
import { authOrigin, authSecret } from "./config";
export const auth = betterAuth({
  appName: "WarrantyIDEA",
  baseURL: authOrigin(),
  secret: authSecret(),
  trustedOrigins: [authOrigin()],
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    password: {
      hash: (password) =>
        hash(password, {
          algorithm: 2 /* Argon2id; native package exports an ambient const enum */,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        }),
      verify: ({ hash: encoded, password }) => verify(encoded, password),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["buyer", "admin"],
        required: false,
        defaultValue: "buyer",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: authOrigin().startsWith("https:"),
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: authOrigin().startsWith("https:"),
    },
    ipAddress: { ipAddressHeaders: ["x-warrantyidea-client-ip"] },
  },
  logger: { disabled: true },
});
