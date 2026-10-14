import React from 'react';
import { Eye, Edit3 } from 'lucide-react';
import { Badge } from '../../../../design-system';
import type { HskLevel } from '../types';

export interface HskLevelTabProps {
  levels: HskLevel[];
  onSelectLevel: (lvl: HskLevel) => void;
}

export const HskLevelTab: React.FC<HskLevelTabProps> = ({
  levels,
  onSelectLevel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-1) 0' }}>
          Khung Cấp độ Chuẩn HSK 3.0 Quốc tế
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
          Hệ thống cấu hình dữ liệu chuẩn gồm 9 bậc cấp độ (HSK 1 đến HSK 7–9). Định mức giúp giáo viên và quản trị viên kiểm soát khối lượng từ vựng cần thiết.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Mã cấp độ</th>
              <th>Tên cấp độ</th>
              <th>Từ vựng mục tiêu</th>
              <th>Chữ Hán mục tiêu</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((lvl) => (
              <tr
                key={lvl.id}
                className="lcm-row-clickable"
                onClick={() => onSelectLevel(lvl)}
              >
                <td><strong>#{lvl.orderIndex}</strong></td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                    {lvl.levelCode}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{lvl.name}</span>
                </td>
                <td>{lvl.targetVocabularyCount.toLocaleString('vi-VN')} từ</td>
                <td>{lvl.targetCharacterCount.toLocaleString('vi-VN')} chữ</td>
                <td>
                  <Badge variant={lvl.active ? 'primary' : 'neutral'}>
                    {lvl.active ? 'Đang kích hoạt' : 'Tạm ẩn'}
                  </Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLevel(lvl);
                    }}
                    title="Xem chi tiết"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLevel(lvl);
                    }}
                    title="Chỉnh sửa cấu hình"
                  >
                    <Edit3 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="lcm-card-list">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className="lcm-item-card"
            onClick={() => onSelectLevel(lvl)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{lvl.name}</span>
              <Badge variant={lvl.active ? 'primary' : 'neutral'}>
                {lvl.active ? 'Kích hoạt' : 'Ẩn'}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
              <span>Mục tiêu: {lvl.targetVocabularyCount} từ · {lvl.targetCharacterCount} chữ</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{lvl.levelCode}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
