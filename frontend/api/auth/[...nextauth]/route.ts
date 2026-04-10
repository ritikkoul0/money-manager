import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        if (token.backendId) {
          (session.user as any).backendId = token.backendId;
        }
        if (token.googleId) {
          (session.user as any).googleId = token.googleId;
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        token.id = user.id;
        token.googleId = account.providerAccountId;
        
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
          const response = await fetch(`${backendUrl}/users/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              google_id: account.providerAccountId,
              picture: user.image,
              auth_provider: "google",
            }),
          });
          
          if (response.ok) {
            const backendUser = await response.json();
            token.backendId = backendUser.id;
            console.log("User synced with backend, ID:", backendUser.id);
          }
        } catch (error) {
          console.error("Failed to sync user with backend:", error);
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


