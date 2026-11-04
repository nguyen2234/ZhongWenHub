import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginRequest, AuthResponse } from '../types/auth.types';
import { authService } from '../services/authService';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { managementAuthService } from '../../../management/shared/services/management-auth.service';
import { adminRolePermissionService } from '../../../management/admin/roles/services/role-permission.service';
import type { UserRole } from '../../../types/roles';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (updated: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncManagementSession = useCallback((authUser: AuthUser | null) => {
    if (!authUser) {
      managementAuthService.clearSession();
      return;
    }

    const primaryRole = (authUser.role || authUser.roles?.[0] || 'STUDENT') as UserRole;
    const roleCode = primaryRole === 'SUPER_ADMIN' ? 'ADMIN' : primaryRole;
    const permissions = adminRolePermissionService.getRoleByCode(roleCode)?.permissions || [];

    managementAuthService.setSession({
      id: authUser.id,
      name: authUser.fullName,
      email: authUser.email,
      role: primaryRole,
      permissions,
      avatarUrl: authUser.avatarUrl,
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        syncManagementSession(currentUser);
        return currentUser;
      } else {
        setUser(null);
        syncManagementSession(null);
        return null;
      }
    } catch {
      setUser(null);
      syncManagementSession(null);
      return null;
    }
  }, [syncManagementSession]);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            syncManagementSession(currentUser);
          } else {
            setUser(null);
            syncManagementSession(null);
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          syncManagementSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Listen to token expiration callbacks
    const unsubscribe = authTokenService.onExpired(() => {
      if (mounted) {
        setUser(null);
        syncManagementSession(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncManagementSession]);

  const login = useCallback(
    async (req: LoginRequest): Promise<AuthResponse> => {
      const res = await authService.login(req);
      if (res.success && res.user) {
        setUser(res.user);
        syncManagementSession(res.user);
      }
      return res;
    },
    [syncManagementSession]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      syncManagementSession(null);
    }
  }, [syncManagementSession]);

  const updateUser = useCallback(
    (updated: Partial<AuthUser>) => {
      setUser((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updated };
        syncManagementSession(next);
        return next;
      });
    },
    [syncManagementSession]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user && authTokenService.isAuthenticated()),
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (req: LoginRequest) => authService.login(req),
      logout: async () => authService.logout(),
      refreshUser: async () => authService.getCurrentUser(),
      updateUser: () => {},
    };
  }
  return context;
}
