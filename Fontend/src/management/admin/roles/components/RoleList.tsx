import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import type { RoleDetail, SystemRoleCode } from '../types/role-permission.types';

export interface RoleListProps {
  roles: RoleDetail[];
  selectedRoleCode: SystemRoleCode;
  dirtyRoles: Set<SystemRoleCode>;
  onSelectRole: (roleCode: SystemRoleCode) => void;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedRoleCode,
  dirtyRoles,
  onSelectRole,
}) => {
  return (
    <div className="rpm-role-list-card">
      <div className="rpm-role-list-header">
        <h2 className="rpm-role-list-title">Vai trò hệ thống</h2>
        <span className="rpm-role-list-count">{roles.length}</span>
      </div>

      <div className="rpm-role-items">
        {roles.map((role) => {
          const isActive = role.code === selectedRoleCode;
          const isDirty = dirtyRoles.has(role.code);

          return (
            <button
              key={role.code}
              type="button"
              className={`rpm-role-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectRole(role.code)}
              aria-current={isActive ? 'true' : undefined}
            >
              <div className="rpm-role-item-top">
                <span className="rpm-role-item-name">
                  <ShieldCheck
                    size={16}
                    color={isActive ? 'var(--primary)' : 'var(--muted)'}
                  />
                  {role.name}
                </span>
                <span className="rpm-role-item-code">{role.code}</span>
              </div>

              <div className="rpm-role-item-meta">
                <span className="rpm-role-item-users">
                  <Users size={13} />
                  {role.userCount.toLocaleString('vi-VN')} người dùng
                </span>

                {isDirty && (
                  <span className="rpm-dirty-indicator" title="Có chỉnh sửa chưa lưu">
                    <span className="rpm-dirty-dot" />
                    Chưa lưu
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
