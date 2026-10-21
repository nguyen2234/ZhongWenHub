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

export interface TableColumn<T = any> {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortField?: string;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low';
  render?: (row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  className?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface RowAction<T> {
  key?: string;
  id?: string;
  label: string | ((row: T) => string);
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean | ((row: T) => boolean);
  hidden?: boolean | ((row: T) => boolean);
  isVisible?: (row: T) => boolean;
  onClick: (row: T) => void;
  permission?: string;
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string | ((row: T) => string);
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (selectedRows: T[]) => void;
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string | ((count: number) => string);
}

export interface TableFilterSelectOption {
  label: string;
  value: string | number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  page: number;
  totalPages: number;
  pageSize: number;
}
