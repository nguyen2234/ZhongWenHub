import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { supportTicketService } from '../../../management/support/services/support-ticket.service';
import type { TicketCategory, TicketPriority } from '../../../management/support/types/support-ticket.types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: TicketCategory;
  contextModule?: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'OTHER',
  contextModule,
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề sự cố.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Vui lòng mô tả chi tiết sự cố bạn đang gặp phải.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await supportTicketService.createTicketAsync({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        contextModule: contextModule || 'WEB_APP',
        contextUrl: typeof window !== 'undefined' ? window.location.pathname : '',
      });

      setSuccessTicketId(created.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể gửi báo cáo sự cố. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubject('');
    setDescription('');
    setCategory(defaultCategory);
    setPriority('MEDIUM');
    setErrorMessage(null);
    setSuccessTicketId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Báo cáo sự cố & Góp ý</h3>
            <p className="text-xs text-gray-500">Đội ngũ kỹ thuật và học liệu sẽ phản hồi trực tiếp</p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {successTicketId ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-gray-900">Gửi báo cáo thành công!</h4>
              <p className="text-sm text-gray-600">
                Mã theo dõi vé sự cố của bạn:{' '}
                <span className="font-mono font-bold text-primary-600">{successTicketId}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Bạn có thể theo dõi tiến độ xử lý và phản hồi trong mục "Báo cáo của tôi".
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Danh mục sự cố <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="CONTENT">Nội dung học liệu</option>
                  <option value="TECHNICAL">Lỗi kỹ thuật / Audio</option>
                  <option value="ACCOUNT">Tài khoản & Đăng nhập</option>
                  <option value="BILLING">Giao dịch / Đăng ký</option>
                  <option value="OTHER">Vấn đề khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="LOW">Thấp (Tư vấn chung)</option>
                  <option value="MEDIUM">Bình thường (Tiêu chuẩn)</option>
                  <option value="HIGH">Cao (Ảnh hưởng học tập)</option>
                  <option value="URGENT">Khẩn cấp (Không thể học)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tiêu đề ngắn gọn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Sai đáp án câu hỏi 3 trong bài kiểm tra HSK 2"
                maxLength={250}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả chi tiết sự cố <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng cung cấp chi tiết lỗi bạn gặp phải để chúng tôi hỗ trợ nhanh nhất..."
                maxLength={4000}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
