import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"

export const authConfig = {
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
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicRoute = ["/", "/opportunities", "/talent", "/companies", "/specializations", "/auth"].some(route => 
        nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
      )
      
      if (!isLoggedIn && !isPublicRoute) {
        return false
      }
      return true
    },
  },
} satisfies NextAuthConfig
