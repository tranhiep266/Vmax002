export default function Dashboard() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Tổng quan</h2>
      <p>Chào mừng bạn đến trang quản lý điện thoại.</p>
      <ul className="list-disc pl-5 text-sm">
        <li>Vào mục <b>Điện thoại</b> để xem/ thêm/ sửa/ xoá.</li>
        <li>Ô tìm kiếm hỗ trợ theo <b>tên</b> hoặc <b>pin</b> (mAh).</li>
      </ul>
    </div>
  );
}
