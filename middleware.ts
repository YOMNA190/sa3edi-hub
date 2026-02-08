import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  const publicRoutes = ["/", "/opportunities", "/talent", "/companies", "/specializations", "/auth", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route)) || 
                        nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)

  if (nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
