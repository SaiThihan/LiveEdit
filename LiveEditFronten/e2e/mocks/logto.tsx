import React from 'react';

export const LogtoProvider: React.FC<{
  children: React.ReactNode;
  config: unknown;
}> = ({ children }) => <>{children}</>;

export const useLogto = () => ({
  isLoading: false,
  isAuthenticated: false,
  getIdToken: async () => null,
  signIn: async () => undefined,
  signOut: async () => undefined,
  error: null,
});

export const useHandleSignInCallback = () => ({
  isLoading: false,
  error: null,
});
