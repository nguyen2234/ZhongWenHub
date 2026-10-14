import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader, ConfirmDialog } from '../../../shared/components';
import {
  RoleList,
  RoleDetailHeader,
  PermissionModuleCard,
  UnsavedChangesBar,
} from '../components';
import { adminRolePermissionService } from '../services/role-permission.service';
import type {
  PermissionModuleId,
  SystemRoleCode,
} from '../types/role-permission.types';
import '../components/role-permission-management.css';

export const AdminRolesPage: React.FC = () => {
  // 1. Data from service
  const [rolesVersion, setRolesVersion] = useState(0);
  const roles = useMemo(() => {
    void rolesVersion;
    return adminRolePermissionService.getRoles();
  }, [rolesVersion]);

  const moduleGroups = useMemo(() => {
    return adminRolePermissionService.getPermissionModuleGroups();
  }, []);

  const totalSystemPermissions = useMemo(() => {
    return adminRolePermissionService.getPermissions().length;
  }, []);

  // 2. Active selection
  const [selectedRoleCode, setSelectedRoleCode] = useState<SystemRoleCode>('ADMIN');

  // 3. Draft states for all roles
  const [draftPermissions, setDraftPermissions] = useState<Record<SystemRoleCode, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    adminRolePermissionService.getRoles().forEach((r) => {
      initial[r.code] = [...r.permissions];
    });
    return initial as Record<SystemRoleCode, string[]>;
  });

  const [draftDescriptions, setDraftDescriptions] = useState<Record<SystemRoleCode, string>>(() => {
    const initial: Record<string, string> = {};
    adminRolePermissionService.getRoles().forEach((r) => {
      initial[r.code] = r.description;
    });
    return initial as Record<SystemRoleCode, string>;
  });

  // 4. Dirty tracking
  const dirtyRoles = useMemo(() => {
    const set = new Set<SystemRoleCode>();

    roles.forEach((savedRole) => {
      // ADMIN is never dirty (immutable permissions & description)
      if (savedRole.code === 'ADMIN') return;

      const currentDraft = draftPermissions[savedRole.code] || [];
      const currentDesc = draftDescriptions[savedRole.code] ?? '';

      // Compare permissions set
      const isPermChanged =
        currentDraft.length !== savedRole.permissions.length ||
        currentDraft.some((p) => !savedRole.permissions.includes(p)) ||
        savedRole.permissions.some((p) => !currentDraft.includes(p));

      // Compare description
      const isDescChanged = currentDesc.trim() !== savedRole.description.trim();

      if (isPermChanged || isDescChanged) {
        set.add(savedRole.code);
      }
    });

    return set;
  }, [roles, draftPermissions, draftDescriptions]);

  const isCurrentRoleDirty = dirtyRoles.has(selectedRoleCode);

  // 5. Switching role with unsaved changes dialog
  const [pendingSwitchRoleCode, setPendingSwitchRoleCode] = useState<SystemRoleCode | null>(null);
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);

  const handleSelectRole = useCallback(
    (targetCode: SystemRoleCode) => {
      if (targetCode === selectedRoleCode) return;

      if (isCurrentRoleDirty) {
        setPendingSwitchRoleCode(targetCode);
        setIsSwitchDialogOpen(true);
      } else {
        setSelectedRoleCode(targetCode);
      }
    },
    [selectedRoleCode, isCurrentRoleDirty]
  );

  const handleConfirmDiscardAndSwitch = useCallback(() => {
    if (!pendingSwitchRoleCode) return;

    // Discard draft changes for currently selected role
    const currentSavedRole = roles.find((r) => r.code === selectedRoleCode);
    if (currentSavedRole) {
      setDraftPermissions((prev) => ({
        ...prev,
        [selectedRoleCode]: [...currentSavedRole.permissions],
      }));
      setDraftDescriptions((prev) => ({
        ...prev,
        [selectedRoleCode]: currentSavedRole.description,
      }));
    }

    setSelectedRoleCode(pendingSwitchRoleCode);
    setPendingSwitchRoleCode(null);
    setIsSwitchDialogOpen(false);
  }, [pendingSwitchRoleCode, roles, selectedRoleCode]);

  const handleCancelSwitch = useCallback(() => {
    setPendingSwitchRoleCode(null);
    setIsSwitchDialogOpen(false);
  }, []);

  // 6. Permission toggling in draft state
  const handleTogglePermission = useCallback(
    (permCode: string) => {
      if (selectedRoleCode === 'ADMIN') return; // Read-only

      setDraftPermissions((prev) => {
        const currentList = prev[selectedRoleCode] || [];
        const exists = currentList.includes(permCode);
        const updated = exists
          ? currentList.filter((c) => c !== permCode)
          : [...currentList, permCode];

        return {
          ...prev,
          [selectedRoleCode]: updated,
        };
      });
    },
    [selectedRoleCode]
  );

  const handleToggleModuleAll = useCallback(
    (moduleId: PermissionModuleId, selectAll: boolean) => {
      if (selectedRoleCode === 'ADMIN') return; // Read-only

      const group = moduleGroups.find((g) => g.id === moduleId);
      if (!group) return;

      const groupCodes = group.permissions.map((p) => p.code);

      setDraftPermissions((prev) => {
        const currentList = prev[selectedRoleCode] || [];
        let updated: string[];

        if (selectAll) {
          // Add all missing codes from this group
          const toAdd = groupCodes.filter((c) => !currentList.includes(c));
          updated = [...currentList, ...toAdd];
        } else {
          // Remove all codes of this group
          updated = currentList.filter((c) => !groupCodes.includes(c));
        }

        return {
          ...prev,
          [selectedRoleCode]: updated,
        };
      });
    },
    [selectedRoleCode, moduleGroups]
  );

  // 7. Description edit in draft state
  const handleDescriptionChange = useCallback(
    (newDesc: string) => {
      if (selectedRoleCode === 'ADMIN') return;
      setDraftDescriptions((prev) => ({
        ...prev,
        [selectedRoleCode]: newDesc,
      }));
    },
    [selectedRoleCode]
  );

  // 8. Save and Cancel workflow
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(() => {
    if (selectedRoleCode === 'ADMIN') return;

    setIsSaving(true);
    try {
      const currentDraftPerms = draftPermissions[selectedRoleCode] || [];
      const currentDraftDesc = draftDescriptions[selectedRoleCode] || '';

      adminRolePermissionService.updateRolePermissions(selectedRoleCode, currentDraftPerms);
      adminRolePermissionService.updateRoleDescription(selectedRoleCode, currentDraftDesc);

      setRolesVersion((v) => v + 1);
    } finally {
      setIsSaving(false);
    }
  }, [selectedRoleCode, draftPermissions, draftDescriptions]);

  const handleCancel = useCallback(() => {
    const currentSavedRole = roles.find((r) => r.code === selectedRoleCode);
    if (!currentSavedRole) return;

    setDraftPermissions((prev) => ({
      ...prev,
      [selectedRoleCode]: [...currentSavedRole.permissions],
    }));
    setDraftDescriptions((prev) => ({
      ...prev,
      [selectedRoleCode]: currentSavedRole.description,
    }));
  }, [roles, selectedRoleCode]);

  // Derived current role data
  const currentRole = useMemo(() => {
    return roles.find((r) => r.code === selectedRoleCode) || roles[0];
  }, [roles, selectedRoleCode]);

  const currentRoleAssignedPermissions = useMemo(() => {
    if (selectedRoleCode === 'ADMIN') {
      return currentRole.permissions;
    }
    return draftPermissions[selectedRoleCode] || [];
  }, [selectedRoleCode, currentRole, draftPermissions]);

  const currentRoleDraftDesc = draftDescriptions[selectedRoleCode] ?? currentRole.description;

  return (
    <div className="rpm-page-container">
      <PageHeader
        title="Quản lý vai trò & quyền hạn"
        subtitle="Xem danh mục vai trò hệ thống và thiết lập quyền hạn chi tiết cho từng phân hệ chức năng."
      />

      {/* Mobile Role Switcher */}
      <div style={{ marginBottom: 'var(--space-4)' }} className="rpm-mobile-selector-wrap">
        <select
          className="rpm-role-mobile-select"
          value={selectedRoleCode}
          onChange={(e) => handleSelectRole(e.target.value as SystemRoleCode)}
          style={{ display: 'none' }}
        >
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name} ({r.code}) {dirtyRoles.has(r.code) ? '• Chưa lưu' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="rpm-layout">
        {/* Left Column: Role List */}
        <aside>
          <RoleList
            roles={roles}
            selectedRoleCode={selectedRoleCode}
            dirtyRoles={dirtyRoles}
            onSelectRole={handleSelectRole}
          />
        </aside>

        {/* Right Column: Selected Role Detail + Permission Workspace */}
        <main className="rpm-detail-pane">
          <RoleDetailHeader
            role={currentRole}
            totalSystemPermissions={totalSystemPermissions}
            assignedCount={currentRoleAssignedPermissions.length}
            draftDescription={currentRoleDraftDesc}
            onDescriptionChange={handleDescriptionChange}
          />

          {/* Module Cards Grid */}
          <div className="rpm-modules-grid">
            {moduleGroups.map((group) => (
              <PermissionModuleCard
                key={group.id}
                group={group}
                assignedPermissions={currentRoleAssignedPermissions}
                isReadOnly={selectedRoleCode === 'ADMIN'}
                onTogglePermission={handleTogglePermission}
                onToggleModuleAll={handleToggleModuleAll}
              />
            ))}
          </div>

          {/* Unsaved Changes Bar */}
          {isCurrentRoleDirty && selectedRoleCode !== 'ADMIN' && (
            <UnsavedChangesBar
              roleName={currentRole.name}
              isSaving={isSaving}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          )}
        </main>
      </div>

      {/* Confirmation Dialog on Switching Roles with Unsaved Changes */}
      <ConfirmDialog
        isOpen={isSwitchDialogOpen}
        title="Xác nhận chuyển vai trò"
        message={`Bạn có thay đổi chưa lưu cho vai trò "${currentRole.name}". Nếu chuyển vai trò, các thay đổi chưa lưu này sẽ bị hủy bỏ.`}
        confirmLabel="Hủy thay đổi và chuyển"
        cancelLabel="Ở lại"
        isDestructive={true}
        onConfirm={handleConfirmDiscardAndSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
};
