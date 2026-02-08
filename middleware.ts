import NextAuth from "next-auth"
import { authConfig } from "./lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const publicRoutes = [
  "/",
  "/opportunities",
  "/talent",
  "/companies",
  "/specializations",
  "/auth",
  "/api/webhook",
  "/_next",
  "/favicon.ico"
]

const staticFileRegex = /\.(jpg|jpeg|png|gif|ico|svg|css|js)$/

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  
  if (staticFileRegex.test(pathname)) {
    return NextResponse.next()
  }
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role as string | undefined
  const userStatus = req.auth?.user?.status as string | undefined

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL("/auth/signin", nextUrl)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (isLoggedIn && userStatus === "PENDING" && !pathname.startsWith("/auth/pending")) {
    return NextResponse.redirect(new URL("/auth/pending", nextUrl))
  }

  if (isLoggedIn && userStatus === "REJECTED" && !pathname.startsWith("/auth/rejected")) {
    return NextResponse.redirect(new URL("/auth/rejected", nextUrl))
  }

  const routePermissions: Record<string, string[]> = {
    "/admin": ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    "/admin/audit-logs": ["SUPER_ADMIN"],
    "/member": ["MEMBER", "ADMIN", "SUPER_ADMIN"],
    "/company": ["COMPANY", "ADMIN", "SUPER_ADMIN"],
  }

  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole || "")) {
        return NextResponse.redirect(new URL("/unauthorized", nextUrl))
      }
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  return response
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
