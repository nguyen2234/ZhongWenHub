import React from 'react';
import type { UserRole } from '../../../types';

export interface ManagementNavItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  badge?: string | number;
  roles: UserRole[];
  children?: ManagementNavItem[];
}

export interface ManagementNavGroup {
  id: string;
  title: string;
  items: ManagementNavItem[];
}

export interface ManagementUserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  page: number;
  totalPages: number;
  pageSize: number;
}
