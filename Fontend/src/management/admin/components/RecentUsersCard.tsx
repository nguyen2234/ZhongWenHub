import React from 'react';
import { Link } from 'react-router-dom';
import type { RecentUser } from '../types/dashboard.types';
import { StatusBadge } from '../../shared/components';

export interface RecentUsersCardProps {
  users: RecentUser[];
}

export const RecentUsersCard: React.FC<RecentUsersCardProps> = ({ users }) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="operations-card">
      <div className="operations-card-header">
        <h3 className="operations-card-title">Học viên mới đăng ký</h3>
        <Link to="/management/admin/users" className="operations-card-action">
          Xem tất cả ({users.length})
        </Link>
      </div>

      <div className="recent-users-list">
        {users.map((user) => {
          const statusVariant = user.status === 'active' ? 'success' : 'warning';
          const statusLabel = user.status === 'active' ? 'Hoạt động' : 'Chờ xác thực';

          return (
            <div key={user.id} className="recent-user-row">
              <div className="recent-user-profile">
                <div className="user-avatar-initials">
                  {getInitials(user.name)}
                </div>
                <div className="user-info-text">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>

              <div className="recent-user-meta">
                <span className="hsk-level-badge">{user.hskLevel}</span>
                <span className="user-joined-time">{user.joinedAt}</span>
                <StatusBadge label={statusLabel} variant={statusVariant} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
