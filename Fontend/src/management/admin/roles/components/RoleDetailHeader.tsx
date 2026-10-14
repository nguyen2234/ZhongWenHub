import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Users, Edit3, Check, X, Info } from 'lucide-react';
import { Badge } from '../../../../design-system';
import type { RoleDetail } from '../types/role-permission.types';

export interface RoleDetailHeaderProps {
  role: RoleDetail;
  totalSystemPermissions: number;
  assignedCount: number;
  draftDescription: string;
  onDescriptionChange: (newDesc: string) => void;
}

export const RoleDetailHeader: React.FC<RoleDetailHeaderProps> = ({
  role,
  totalSystemPermissions,
  assignedCount,
  draftDescription,
  onDescriptionChange,
}) => {
  const isAdmin = role.code === 'ADMIN';
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(draftDescription);

  const handleStartEdit = () => {
    if (isAdmin) return;
    setTempDesc(draftDescription);
    setIsEditingDesc(true);
  };

  const handleSaveDesc = () => {
    onDescriptionChange(tempDesc);
    setIsEditingDesc(false);
  };

  const handleCancelDesc = () => {
    setTempDesc(draftDescription);
    setIsEditingDesc(false);
  };

  return (
    <div className="rpm-role-header-card">
      <div className="rpm-role-header-top">
        <div className="rpm-role-header-identity">
          <div>
            <h2 className="rpm-role-header-title">
              {isAdmin ? (
                <ShieldAlert size={22} color="var(--primary)" />
              ) : (
                <ShieldCheck size={22} color="var(--primary)" />
              )}
              {role.name}
            </h2>
          </div>
        </div>

        <div className="rpm-role-header-badges">
          <Badge variant="neutral">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{role.code}</span>
          </Badge>
          <Badge variant="primary">Vai trò hệ thống</Badge>
          {isAdmin && <Badge variant="streak">Toàn quyền quản trị</Badge>}
        </div>
      </div>

      <div className="rpm-role-stats">
        <div className="rpm-role-stat-item">
          <Users size={14} />
          <span>Thành viên: <strong>{role.userCount.toLocaleString('vi-VN')}</strong></span>
        </div>
        <div className="rpm-role-stat-item">
          <span>Quyền hạn kích hoạt: <strong>{assignedCount} / {totalSystemPermissions}</strong></span>
        </div>
      </div>

      {/* Description Section */}
      <div className="rpm-description-section">
        {!isEditingDesc ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
            <p className="rpm-description-display">
              {draftDescription || 'Chưa có mô tả cho vai trò này.'}
            </p>
            {!isAdmin && (
              <button
                type="button"
                className="ds-btn ds-btn-ghost ds-btn-sm"
                onClick={handleStartEdit}
                title="Chỉnh sửa mô tả"
                style={{ padding: '4px 8px', height: 'auto', minHeight: 'unset' }}
              >
                <Edit3 size={13} style={{ marginRight: '4px' }} />
                Sửa mô tả
              </button>
            )}
          </div>
        ) : (
          <div className="rpm-description-form">
            <textarea
              className="rpm-description-input"
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              placeholder="Nhập mô tả vai trò..."
              rows={2}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleCancelDesc}
              >
                <X size={13} />
                Hủy
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSaveDesc}
              >
                <Check size={13} />
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN Informational Notice Banner */}
      {isAdmin && (
        <div className="rpm-info-banner rpm-info-banner-admin" style={{ marginTop: 'var(--space-4)' }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 className="rpm-info-banner-title">Quyền hạn bất biến của Quản trị viên</h4>
            <p className="rpm-info-banner-desc">
              Quản trị viên là vai trò hệ thống cao nhất và mặc định có toàn bộ quyền trong ZhongWenHub.
              Tất cả quyền hạn được duy trì tự động và khóa ở trạng thái kích hoạt để bảo vệ tính toàn vẹn của hệ thống.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
