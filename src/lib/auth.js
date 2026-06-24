import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[NextAuth] Authorize called with email:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          return null;
        }

        try {
          const sql = getDb();
          const rows = await sql`
            SELECT id, email, password_hash, username
            FROM users
            WHERE email = ${credentials.email}
          `;

          if (rows.length === 0) {
            console.log('[NextAuth] User not found');
            return null;
          }

          const user = rows[0];
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            console.log('[NextAuth] Invalid password');
            return null;
          }

          console.log('[NextAuth] Login successful for:', user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.username
          };
        } catch (error) {
          console.error('[NextAuth] Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('[NextAuth] JWT callback. User:', user, 'Token:', token);
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth] Session callback. Token:', token);
      if (token) {
        if (!session.user) {
          session.user = {};
        }
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth'
  }
});
