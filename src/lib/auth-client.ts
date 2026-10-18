"use client";
import { createAuthClient } from "better-auth/react";
// Omitting baseURL deliberately uses the current request origin.
export const authClient = createAuthClient();
