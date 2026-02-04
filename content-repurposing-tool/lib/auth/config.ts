import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";

/**
 * NextAuth configuration
 * Supports email/password authentication with JWT sessions
 * Designed to be extended with OAuth providers in the future
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate input
        const validated = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validated.success) {
          throw new Error("Invalid email or password format");
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: validated.data.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          validated.data.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        // Return user object (will be stored in JWT token)
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  
  // Session strategy - JWT for stateless authentication
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // JWT configuration
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  
  // Pages customization (optional - will use default pages)
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on auth errors
  },
  
  // Security settings
  secret: process.env.NEXTAUTH_SECRET,

  // Required when deployed behind proxy (e.g. Railway, Vercel)
  trustHost: true,

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
});

export const authOptions = {
  handlers,
  auth,
  signIn,
  signOut,
};
