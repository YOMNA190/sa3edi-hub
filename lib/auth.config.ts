import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [], // Providers will be added in auth.ts
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
