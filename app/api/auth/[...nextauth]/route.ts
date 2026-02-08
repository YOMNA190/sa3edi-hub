import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

const handler = NextAuth(authConfig)

export { handlers as GET, handlers as POST } from "../../../../lib/auth";