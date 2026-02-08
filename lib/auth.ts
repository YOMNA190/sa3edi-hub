import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import { prisma } from "./prisma"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
        session.user.status = (user as any).status
      }
      return session
    },
    async signIn({ user }) {
      if (user.email === process.env.SUPER_ADMIN_EMAIL) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "SUPER_ADMIN", status: "ACTIVE" }
        })
      }
      return true
    }
  },
  events: {
    async createUser({ user }) {
      await prisma.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id!,
          metadata: { email: user.email }
        }
      })
    }
  }
}

// Helper functions
export const requireRole = (allowedRoles: string[]) => {
  return async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    })
    
    if (!user || user.status !== "ACTIVE") {
      throw new Error("Unauthorized")
    }
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Insufficient permissions")
    }
    
    return user
  }
}
