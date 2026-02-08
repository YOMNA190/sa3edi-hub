import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"

export const { 
  handlers: { GET, POST }, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { 
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (user.email?.endsWith("@tempmail.com")) {
        return false
      }
      
      if (user.email === process.env.SUPER_ADMIN_EMAIL && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { role: "SUPER_ADMIN", status: "ACTIVE" },
          create: { 
            email: user.email, 
            role: "SUPER_ADMIN", 
            status: "ACTIVE",
            name: user.name 
          }
        })
      }
      return true
    },
    async session({ session, user }) {
      if (session.user && user) {
        const freshUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true, id: true }
        })
        
        if (freshUser) {
          session.user.id = freshUser.id
          session.user.role = freshUser.role as any
          session.user.status = freshUser.status as any
        }
      }
      return session
    }
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        await prisma.auditLog.create({
          data: {
            action: "USER_REGISTERED",
            entityType: "User",
            entityId: user.id!,
            metadata: { provider: user.email ? "email" : "oauth" }
          }
        })
      } else {
        await prisma.auditLog.create({
          data: {
            action: "USER_LOGIN",
            entityType: "User",
            entityId: user.id!
          }
        })
      }
    }
  }
})

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
