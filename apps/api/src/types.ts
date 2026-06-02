// Express request context types for authenticated SupportAI routes.
export interface AuthContext {
  userId: string;
  email?: string;
  businessId?: string;
}

export interface RequestContext {
  requestId: string;
  auth?: AuthContext;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}
