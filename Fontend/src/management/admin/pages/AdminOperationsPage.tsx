import React, { useMemo, useState } from 'react';
import { Bot, BarChart3, LifeBuoy, Settings, Download, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../shared/components';
import './admin-operations.css';

type PageKind = 'ai-management' | 'analytics' | 'support-requests' | 'settings';
type Ticket = { id:string; subject:string; category:string; priority:'Gấp'|'Cao'|'Bình thường'; status:'Mới'|'Đang xử lý'|'Đã giải quyết'; assignee:string };
const seedTickets:Ticket[] = [
 {id:'SUP-001',subject:'Không phát được video luyện nghe HSK 3',category:'Kỹ thuật',priority:'Gấp',status:'Mới',assignee:'Chưa phân công'},
 {id:'SUP-002',subject:'Câu hỏi ngữ pháp cần rà soát đáp án',category:'Học liệu',priority:'Cao',status:'Đang xử lý',assignee:'Nhân viên hỗ trợ'},
 {id:'SUP-003',subject:'Không đặt lại được mật khẩu',category:'Tài khoản',priority:'Cao',status:'Mới',assignee:'Chưa phân công'},
 {id:'SUP-004',subject:'Thắc mắc về lịch ôn tập HSK 2',category:'Học tập',priority:'Bình thường',status:'Đã giải quyết',assignee:'Nhân viên hỗ trợ'}
];
const aiServices = [
 {name:'AI Tutor',description:'Trợ lý hội thoại và giải thích ngữ pháp',usage:74},
 {name:'AI Grading',description:'Chấm bài viết và phản hồi',usage:42},
 {name:'AI Live',description:'Luyện nói tương tác',usage:28},
 {name:'AI Analytics',description:'Gợi ý lộ trình cá nhân',usage:61}
];
const stats = [{label:'Học viên demo',value:1248},{label:'Hoạt động học demo',value:6832},{label:'Hoàn thành bài học demo',value:72},{label:'Yêu cầu hỗ trợ demo',value:34}];
const format = (n:number)=>new Intl.NumberFormat('vi-VN').format(n);
export const AdminOperationsPage:React.FC<{kind:PageKind}> = ({kind})=>{
 const [query,setQuery]=useState('');
 const [status,setStatus]=useState('ALL');
 const [tickets,setTickets]=useState(seedTickets);
 const [selected,setSelected]=useState<string|null>(null);
 const [aiEnabled,setAiEnabled]=useState<Record<string,boolean>>({});
 const [aiQuota,setAiQuota]=useState(100);
 const [settings,setSettings]=useState({platformName:'ZhongWenHub',maintenance:false,notice:'',maxAttempts:5});
 const [saved,setSaved]=useState(false);
 const title:Record<PageKind,string>={'ai-management':'Giám sát AI','analytics':'Báo cáo & Phân tích','support-requests':'Giám sát yêu cầu hỗ trợ','settings':'Cài đặt hệ thống'};
 const subtitle:Record<PageKind,string>={'ai-management':'Theo dõi mô phỏng khả năng cung cấp dịch vụ và hạn mức AI.','analytics':'Tổng quan số liệu minh họa, không phải số liệu thời gian thực.','support-requests':'Xem và điều phối phiếu hỗ trợ trên dữ liệu demo.','settings':'Thiết lập giao diện mô phỏng, chưa kết nối cấu hình máy chủ.'};
 const visible=useMemo(()=>tickets.filter(t=>(status==='ALL'||t.status===status)&&`${t.id} ${t.subject} ${t.category}`.toLowerCase().includes(query.toLowerCase())),[tickets,status,query]);
 const downloadCsv=()=>{
  const rows=[['Mã','Chủ đề','Danh mục','Ưu tiên','Trạng thái','Phân công'],...visible.map(t=>[t.id,t.subject,t.category,t.priority,t.status,t.assignee])];
  const csv='\uFEFF'+rows.map(r=>r.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='zhongwenhub-tickets-demo.csv';a.click();URL.revokeObjectURL(url);
 };
 const updateTicket=(id:string,patch:Partial<Ticket>)=>{setTickets(p=>p.map(t=>t.id===id?{...t,...patch}:t));};
 return <div className="ao-page">
  <PageHeader title={title[kind]} subtitle={subtitle[kind]}/>
  <div className="ao-demo"><AlertTriangle size={16}/><span>Chế độ demo frontend: dữ liệu và thay đổi trong trang này chỉ tồn tại trong phiên hiển thị, chưa được lưu lên server.</span></div>
  {kind==='ai-management'&&<>
   <div className="ao-toolbar"><label>Ngưỡng hạn mức mô phỏng: <strong>{aiQuota}%</strong><input aria-label="Hạn mức AI demo" type="range" min="10" max="100" value={aiQuota} onChange={e=>setAiQuota(Number(e.target.value))}/></label></div>
   <div className="ao-grid">{aiServices.map(s=><section className="ao-card" key={s.name}><div className="ao-row"><Bot size={20}/><strong>{s.name}</strong><span className="ao-muted">Demo</span></div><p>{s.description}</p><label className="ao-switch"><input type="checkbox" checked={aiEnabled[s.name]??true} onChange={e=>setAiEnabled(v=>({...v,[s.name]:e.target.checked}))}/> Cho phép trong mô phỏng</label><p className="ao-muted">Sử dụng hạn mức minh họa: {s.usage}%</p><div className="ao-bar"><div style={{width:`${Math.min(100,s.usage/aiQuota*100)}%`}}/></div></section>)}</div>
  </>}
  {kind==='analytics'&&<>
   <div className="ao-grid">{stats.map((s,i)=><div className="ao-card" key={s.label}><div className="ao-row"><BarChart3 size={18}/><span>{s.label}</span></div><strong className="ao-number">{format(s.value)}{i===2?'%':''}</strong></div>)}</div>
   <section className="ao-card"><h2>Phân bố học viên theo cấp HSK — dữ liệu minh họa</h2>{[37,26,17,10,7,3].map((v,i)=><div className="ao-chart-row" key={i}><span>HSK {i+1}</span><div className="ao-bar"><div style={{width:`${v}%`}}/></div><strong>{v}%</strong></div>)}</section>
   <p className="ao-muted">Báo cáo thực tế và file xuất thống kê sẽ được hỗ trợ sau khi tích hợp nguồn dữ liệu.</p>
  </>}
  {kind==='support-requests'&&<>
   <div className="ao-toolbar"><label className="ao-search"><Search size={16}/><input aria-label="Tìm phiếu hỗ trợ" placeholder="Tìm mã, nội dung hoặc danh mục..." value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Lọc trạng thái" value={status} onChange={e=>setStatus(e.target.value)}>{['ALL','Mới','Đang xử lý','Đã giải quyết'].map(s=><option key={s} value={s}>{s==='ALL'?'Tất cả trạng thái':s}</option>)}</select><button className="ds-btn ds-btn-secondary" onClick={downloadCsv}><Download size={15}/> Xuất CSV demo</button></div>
   <div className="ao-table-wrap"><table className="ao-table"><thead><tr><th>Mã</th><th>Nội dung</th><th>Ưu tiên</th><th>Trạng thái</th><th>Phân công</th><th>Chi tiết</th></tr></thead><tbody>{visible.map(t=><tr key={t.id}><td>{t.id}</td><td><strong>{t.subject}</strong><div className="ao-muted">{t.category}</div></td><td>{t.priority}</td><td>{t.status}</td><td>{t.assignee}</td><td><button className="ds-btn ds-btn-secondary" onClick={()=>setSelected(t.id)}>Xử lý</button></td></tr>)}</tbody></table>{visible.length===0&&<p className="ao-empty">Không tìm thấy phiếu phù hợp. Hãy thay đổi bộ lọc.</p>}</div>
   {selected&&tickets.find(t=>t.id===selected)&&<div className="ao-panel" role="dialog" aria-modal="true" aria-label="Chi tiết phiếu hỗ trợ"><div className="ao-row"><h2>{selected} — Xử lý phiếu demo</h2><button className="ds-btn ds-btn-secondary" onClick={()=>setSelected(null)}>Đóng</button></div><p>{tickets.find(t=>t.id===selected)?.subject}</p><label>Trạng thái <select value={tickets.find(t=>t.id===selected)?.status} onChange={e=>updateTicket(selected,{status:e.target.value as Ticket['status']})}>{['Mới','Đang xử lý','Đã giải quyết'].map(s=><option key={s}>{s}</option>)}</select></label><label>Phân công <select value={tickets.find(t=>t.id===selected)?.assignee} onChange={e=>updateTicket(selected,{assignee:e.target.value})}>{['Chưa phân công','Nhân viên hỗ trợ','Chuyên viên kỹ thuật'].map(s=><option key={s}>{s}</option>)}</select></label><p className="ao-muted">Thao tác chỉ thay đổi dữ liệu trong bộ nhớ, không gửi thông báo thực.</p></div>}
  </>}
  {kind==='settings'&&<form className="ao-card ao-settings" onSubmit={e=>{e.preventDefault();setSaved(true)}}><div className="ao-row"><Settings size={20}/><h2>Thiết lập demo</h2></div><label>Tên nền tảng <input required value={settings.platformName} onChange={e=>{setSaved(false);setSettings({...settings,platformName:e.target.value})}}/></label><label>Nội dung thông báo bản nháp <textarea rows={3} value={settings.notice} onChange={e=>{setSaved(false);setSettings({...settings,notice:e.target.value})}} placeholder="Chỉ lưu trong phiên trình duyệt này"/></label><label>Số lần đăng nhập sai tối đa (minh họa) <input type="number" min={1} max={20} value={settings.maxAttempts} onChange={e=>{setSaved(false);setSettings({...settings,maxAttempts:Number(e.target.value)})}}/></label><label className="ao-switch"><input type="checkbox" checked={settings.maintenance} onChange={e=>{setSaved(false);setSettings({...settings,maintenance:e.target.checked})}}/> Hiển thị trạng thái bảo trì mô phỏng</label><div><button className="ds-btn ds-btn-primary" type="submit"><CheckCircle2 size={16}/> Áp dụng trong phiên</button></div>{saved&&<p role="status" className="ao-success">Đã áp dụng thiết lập demo trong phiên này; chưa lưu vào máy chủ.</p>}</form>}
 </div>;
};
export default AdminOperationsPage;
