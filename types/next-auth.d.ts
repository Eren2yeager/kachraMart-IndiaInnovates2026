import { UserRole } from './index';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
      verified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: UserRole;
    verified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    verified: boolean;
  }
}
