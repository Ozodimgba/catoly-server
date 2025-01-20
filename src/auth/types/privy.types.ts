// src/auth/types/privy.types.ts
export interface PrivyUser {
    sub: string;        // Privy DID
    iss: string;        // Token issuer
    aud: string;        // App ID
    iat: number;        // Issued at timestamp
    exp: number;        // Expiration timestamp
  }
  
  export interface AuthenticatedRequest extends Request {
    user: PrivyUser;
  }