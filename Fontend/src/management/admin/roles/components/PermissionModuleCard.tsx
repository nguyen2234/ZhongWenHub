import React, { useRef, useEffect } from 'react';
import type { PermissionModuleGroup, PermissionModuleId } from '../types/role-permission.types';

export interface PermissionModuleCardProps {
  group: PermissionModuleGroup;
  assignedPermissions: string[];
  isReadOnly: boolean;
  onTogglePermission: (permissionCode: string) => void;
  onToggleModuleAll: (moduleId: PermissionModuleId, selectAll: boolean) => void;
}

export const PermissionModuleCard: React.FC<PermissionModuleCardProps> = ({
  group,
  assignedPermissions,
  isReadOnly,
  onTogglePermission,
  onToggleModuleAll,
}) => {
  const selectAllRef = useRef<HTMLInputElement>(null);

  const totalCount = group.permissions.length;
  const assignedCount = group.permissions.filter((p) =>
    assignedPermissions.includes(p.code)
  ).length;

  const isAllSelected = totalCount > 0 && assignedCount === totalCount;
  const isNoneSelected = assignedCount === 0;
  const isIndeterminate = !isAllSelected && !isNoneSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAllChange = () => {
    if (isReadOnly) return;
    // If all are selected, clear all. Otherwise select all.
    onToggleModuleAll(group.id, !isAllSelected);
  };

  return (
    <div className="rpm-module-card">
      <div className="rpm-module-header">
        <div className="rpm-module-title-wrap">
          <h3 className="rpm-module-name">{group.name}</h3>
          <p className="rpm-module-desc">{group.description}</p>
        </div>
        <span className={`rpm-module-count-badge ${isAllSelected ? 'is-full' : ''}`}>
          {assignedCount} / {totalCount}
        </span>
      </div>

      {/* Select All Checkbox */}
      <label
        className={`rpm-module-select-all ${isReadOnly ? 'is-disabled' : ''}`}
        title={isReadOnly ? 'Vai trò quản trị viên không thể chỉnh sửa' : undefined}
      >
        <input
          ref={selectAllRef}
          type="checkbox"
          className="rpm-checkbox"
          checked={isAllSelected}
          disabled={isReadOnly}
          onChange={handleSelectAllChange}
        />
        <span>Chọn tất cả ({group.name})</span>
      </label>

      {/* Individual Permissions List */}
      <div className="rpm-permission-list">
        {group.permissions.map((perm) => {
          const isChecked = assignedPermissions.includes(perm.code);

          return (
            <label
              key={perm.code}
              className={`rpm-permission-item ${isReadOnly ? 'is-disabled' : ''}`}
              title={perm.description}
            >
              <input
                type="checkbox"
                className="rpm-checkbox"
                checked={isChecked}
                disabled={isReadOnly}
                onChange={() => !isReadOnly && onTogglePermission(perm.code)}
              />
              <div className="rpm-permission-label-wrap">
                <span className="rpm-permission-name">{perm.name}</span>
                <span className="rpm-permission-code">{perm.code}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
