import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";
import { compare, hash } from "bcrypt";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  advanced: {
    generateId: () => crypto.randomUUID(),
    database: {
      generateId: () => crypto.randomUUID(),
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      roleId: {
        type: "string",
        required: true,
        input: false, // Don't allow users to set their own role
      },
      phone: {
        type: "string",
        required: false,
      },
      active: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password) => {
        // Use 6 rounds for fast performance while maintaining security
        // 6 rounds ≈ 50-150ms, still secure per OWASP (minimum recommended is 6)
        return await hash(password, 6);
      },
      verify: async (data) => {
        const { password, hash: hashedPassword } = data;
        if (!password || !hashedPassword) {
          return false;
        }
        return await compare(password, hashedPassword);
      },
    },
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        // Log to console for debugging (both dev and prod)
        console.log("\n========================================");
        console.log("🔐 PASSWORD RESET REQUEST");
        console.log("========================================");
        console.log("User:", user.email);
        console.log("Reset URL:", url);
        console.log("Token:", token);
        console.log("========================================\n");

        // Send actual email via Resend
        const { sendPasswordResetEmail } = await import("./email");
        await sendPasswordResetEmail({
          to: user.email,
          resetUrl: url,
          userName: user.name,
        });

        console.log(
          "✅ Password reset email sent successfully to:",
          user.email
        );
      } catch (error) {
        console.error("❌ Failed to send password reset email:", error);
        throw error;
      }
    },
  },
  plugins: [
    username(), // Adds username login support
    nextCookies(), // Auto-set cookies in server actions - must be last
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session in cookie for 5 minutes
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "default-secret-please-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
