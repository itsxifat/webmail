export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    // 1. Save the role to the token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; 
        token.id = user.id;
      }
      return token;
    },
    // 2. Save the role to the session (so the browser can see it)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role; 
      }
      return session;
    }
  },
};