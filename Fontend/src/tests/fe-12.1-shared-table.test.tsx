// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { renderToString } from 'react-dom/server';
import {
  DataTable,
  ManagementDataTable,
  TableToolbar,
  Pagination,
  StatusBadge,
} from '../management/shared/components';
import type { TableColumn, SortConfig, RowAction } from '../management/shared/types';

describe('FE-12.1: Evondev Shared Management Table Design System', () => {
  interface MockUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'ACTIVE' | 'INACTIVE';
  }

  const mockUsers: MockUser[] = [
    { id: 'u-1', name: 'Nguyễn Văn A', email: 'vana@example.com', role: 'STUDENT', status: 'ACTIVE' },
    { id: 'u-2', name: 'Trần Thị B', email: 'thib@example.com', role: 'TEACHER', status: 'INACTIVE' },
  ];

  const columns: TableColumn<MockUser>[] = [
    { key: 'name', header: 'Họ và tên', sortable: true },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (u) => (
        <StatusBadge
          label={u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
          variant={u.status === 'ACTIVE' ? 'success' : 'danger'}
        />
      ),
    },
  ];

  it('1. should render DataTable and ManagementDataTable alias identically', () => {
    const html1 = renderToString(<DataTable<MockUser> columns={columns} data={mockUsers} />);
    const html2 = renderToString(<ManagementDataTable<MockUser> columns={columns} data={mockUsers} />);

    expect(html1).toContain('Nguyễn Văn A');
    expect(html1).toContain('vana@example.com');
    expect(html1).toContain('mgmt-table-card');
    expect(html2).toEqual(html1);
  });

  it('2. should render sortable headers with proper accessibility attributes', () => {
    const sortConfig: SortConfig = { field: 'name', direction: 'asc' };
    const html = renderToString(
      <DataTable<MockUser>
        columns={columns}
        data={mockUsers}
        sortConfig={sortConfig}
        onSortChange={() => {}}
      />
    );

    expect(html).toContain('aria-sort="ascending"');
    expect(html).toContain('Sắp xếp theo cột Họ và tên');
  });

  it('3. should render checkbox selection columns and rows when selectable is enabled', () => {
    const html = renderToString(
      <DataTable<MockUser>
        columns={columns}
        data={mockUsers}
        selectable
        selectedIds={['u-1']}
        onSelectRow={() => {}}
        onSelectAll={() => {}}
      />
    );

    expect(html).toContain('Chọn tất cả hàng');
    expect(html).toContain('mgmt-th-checkbox');
    expect(html).toContain('mgmt-checkbox');
    expect(html).toContain('is-selected');
  });

  it('4. should render row actions with proper buttons and labels', () => {
    const rowActions: RowAction<MockUser>[] = [
      {
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <span>EditIcon</span>,
        onClick: () => {},
      },
      {
        key: 'delete',
        label: 'Xóa tài khoản',
        icon: <span>DeleteIcon</span>,
        variant: 'danger',
        requireConfirm: true,
        confirmTitle: 'Xác nhận xóa tài khoản',
        onClick: () => {},
      },
    ];

    const html = renderToString(
      <DataTable<MockUser>
        columns={columns}
        data={mockUsers}
        rowActions={rowActions}
      />
    );

    expect(html).toContain('Chỉnh sửa');
    expect(html).toContain('Xóa tài khoản');
    expect(html).toContain('mgmt-actions-group');
  });

  it('5. should render mobile card list alternative for responsive screens (Evondev R9 & R11)', () => {
    const html = renderToString(
      <DataTable<MockUser>
        columns={columns}
        data={mockUsers}
        enableMobileCards
        mobileTitleExtractor={(u) => u.name}
        mobileSubtitleExtractor={(u) => u.email}
        mobileBadgeExtractor={(u) => <StatusBadge label={u.status} variant={u.status === 'ACTIVE' ? 'success' : 'danger'} />}
        mobileFields={[
          { label: 'Vai trò', render: (u) => u.role },
        ]}
      />
    );

    expect(html).toContain('mgmt-mobile-list');
    expect(html).toContain('mgmt-mobile-card');
    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('vana@example.com');
    expect(html).toContain('Vai trò');
  });

  it('6. should render TableSkeleton when loading is true', () => {
    const html = renderToString(<DataTable columns={columns} data={[]} loading />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('mgmt-skeleton-bar');
  });

  it('7. should render EmptyState with filter clearing support when data is empty', () => {
    const html = renderToString(
      <DataTable
        columns={columns}
        data={[]}
        isFiltered
        onClearFilters={() => {}}
      />
    );

    expect(html).toContain('Không tìm thấy kết quả phù hợp');
    expect(html).toContain('Xóa tất cả bộ lọc');
  });

  it('8. should render TableToolbar with debounced search input and bulk actions bar', () => {
    const normalHtml = renderToString(
      <TableToolbar
        searchQuery="test"
        onSearchChange={() => {}}
        searchPlaceholder="Tìm kiếm người dùng..."
      />
    );

    expect(normalHtml).toContain('Tìm kiếm người dùng...');
    expect(normalHtml).toContain('mgmt-search-input');

    const bulkHtml = renderToString(
      <TableToolbar
        selectedCount={3}
        selectedItems={mockUsers}
        bulkActions={[
          {
            key: 'delete_bulk',
            label: 'Xóa 3 mục đã chọn',
            variant: 'danger',
            onClick: () => {},
          },
        ]}
        onClearSelection={() => {}}
      />
    );

    expect(bulkHtml).toContain('Đã chọn');
    expect(bulkHtml).toContain('3');
    expect(bulkHtml).toContain('Xóa 3 mục đã chọn');
    expect(bulkHtml).toContain('Bỏ chọn');
  });

  it('9. should render Pagination with exact count and 44px mobile touch targets (Evondev R20)', () => {
    const html = renderToString(
      <Pagination
        currentPage={2}
        totalPages={10}
        pageSize={20}
        totalItems={195}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );

    expect(html).toContain('Hiển thị');
    expect(html).toContain('21');
    expect(html).toContain('40');
    expect(html).toContain('195');
    expect(html).toContain('bản ghi');
    expect(html).toContain('mgmt-page-btn is-active');
  });

  it('10. should standardize StatusBadge variants according to Evondev M7 Semantic standard', () => {
    const successHtml = renderToString(<StatusBadge label="Xuất bản" variant="published" />);
    const warningHtml = renderToString(<StatusBadge label="Chờ duyệt" variant="pending_review" />);
    const dangerHtml = renderToString(<StatusBadge label="Từ chối" variant="rejected" />);
    const neutralHtml = renderToString(<StatusBadge label="Lưu trữ" variant="archived" />);

    expect(successHtml).toContain('badge-success');
    expect(warningHtml).toContain('badge-warning');
    expect(dangerHtml).toContain('badge-danger');
    expect(neutralHtml).toContain('badge-neutral');
  });
});
