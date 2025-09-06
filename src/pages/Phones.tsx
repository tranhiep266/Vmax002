import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Phone = {
  id: number;
  name: string;
  brand: string;
  battery: number; // mAh
  price: number;   // giá gốc trong kho
  stock: number;   // tồn kho
  imei: string;    // duy nhất
  created_at?: string;
};

type FormState = Omit<Phone, "id" | "created_at"> & { id?: number };
type SortKey = "id" | "name" | "brand" | "battery" | "price" | "stock" | "created_at";

export default function Phones() {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form thêm/sửa
  const emptyForm: FormState = {
    name: "",
    brand: "",
    battery: 0,
    price: 0,
    stock: 1,
    imei: "",
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  // Modal bán hàng
  const [sellPhone, setSellPhone] = useState<Phone | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [priceSold, setPriceSold] = useState<number>(0);
  const [soldDate, setSoldDate] = useState<string>(""); // ⬅️ ngày bán (yyyy-mm-dd)

  //  Filters
  const [q, setQ] = useState("");                  // tìm Tên/IMEI/Pin
  const [brandF, setBrandF] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [batMin, setBatMin] = useState<string>("");
  const [batMax, setBatMax] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);

  // Modal xác nhận xoá
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

  const fetchPhones = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("phones").select("*");

      // ===== TEXT SEARCH (dùng cú pháp dấu chấm + escape) =====
      const raw = q.trim();
      if (raw) {
        const esc = raw
          .replace(/%/g, "\\%")
          .replace(/_/g, "\\_")
          .replace(/,/g, "\\,")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)");
        const parts: string[] = [
          `name.ilike.%${esc}%`,
          `imei.ilike.%${esc}%`,
        ];
        const num = Number.parseInt(raw, 10);
        if (!Number.isNaN(num)) parts.push(`battery.eq.${num}`);
        query = query.or(parts.join(","));
      }

      if (brandF.trim()) query = query.ilike("brand", `%${brandF.trim()}%`);

      const pMin = priceMin.trim() === "" ? null : Number(priceMin);
      const pMax = priceMax.trim() === "" ? null : Number(priceMax);
      if (pMin !== null && !Number.isNaN(pMin)) query = query.gte("price", pMin);
      if (pMax !== null && !Number.isNaN(pMax)) query = query.lte("price", pMax);

      const bMin = batMin.trim() === "" ? null : Number(batMin);
      const bMax = batMax.trim() === "" ? null : Number(batMax);
      if (bMin !== null && !Number.isNaN(bMin)) query = query.gte("battery", bMin);
      if (bMax !== null && !Number.isNaN(bMax)) query = query.lte("battery", bMax);

      if (inStockOnly) query = query.gt("stock", 0);

      query = query.order(sortBy, { ascending: sortAsc });

      const { data, error } = await query;
      if (error) throw error;
      setPhones((data || []) as Phone[]);
    } catch (e: any) {
      setError(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, brandF, priceMin, priceMax, batMin, batMax, inStockOnly, sortBy, sortAsc]);

  const startCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (p: Phone) => {
    setForm({
      id: p.id, name: p.name, brand: p.brand, battery: p.battery,
      price: p.price, stock: p.stock, imei: p.imei,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const saveForm = async () => {
    setLoading(true);
    setError(null);
    try {
      if (form.id) {
        const { error } = await supabase.from("phones").update({
          name: form.name, brand: form.brand, battery: Number(form.battery),
          price: Number(form.price), stock: Number(form.stock), imei: form.imei,
        }).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("phones").insert({
          name: form.name, brand: form.brand, battery: Number(form.battery),
          price: Number(form.price), stock: Number(form.stock), imei: form.imei,
        });
        if (error) throw error;
      }
      cancelForm();
      await fetchPhones();
    } catch (e: any) {
      setError(e.message || "Lỗi lưu dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!sellPhone) return;
    if (!customerName || !customerPhone) {
      alert("Vui lòng nhập đầy đủ thông tin khách hàng!");
      return;
    }
    if (priceSold < 0) {
      alert("Giá bán không hợp lệ!");
      return;
    }
    if (!soldDate) {
      alert("Vui lòng chọn ngày bán!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1) Ghi vào customers (thêm sold_at từ ô ngày đã chọn)
      const { error: insCusErr } = await supabase.from("customers").insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        device_name: sellPhone.name,
        brand: sellPhone.brand,
        battery: sellPhone.battery,
        imei: sellPhone.imei,
        price_original: sellPhone.price,
        price_sold: Number(priceSold),
        sold_at: new Date(soldDate).toISOString(), // ⬅️ lưu ngày bán
      });
      if (insCusErr) throw insCusErr;

      // 2) Xoá khỏi phones
      const { error: delErr } = await supabase.from("phones").delete().eq("id", sellPhone.id);
      if (delErr) throw delErr;

      // reset UI
      setSellPhone(null);
      setCustomerName("");
      setCustomerPhone("");
      setPriceSold(0);
      setSoldDate(""); // reset ngày
      await fetchPhones();
    } catch (e: any) {
      setError(e.message || "Lỗi khi bán");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (id: number) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    setConfirmDeleting(true);
    try {
      const { error } = await supabase.from("phones").delete().eq("id", confirmDeleteId);
      if (error) throw error;
      setConfirmDeleteId(null);
      await fetchPhones();
    } catch (e: any) {
      setError(e.message || "Xoá thất bại");
    } finally {
      setConfirmDeleting(false);
    }
  };

  const totalStock = useMemo(
    () => phones.reduce((s, p) => s + (p.stock || 0), 0),
    [phones]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Điện thoại</h2>

        {/*  Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm Tên/IMEI/Pin..."
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-3"
          />
          <input
            value={brandF}
            onChange={(e) => setBrandF(e.target.value)}
            placeholder="Hãng..."
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Giá từ"
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Giá đến"
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
          <input
            type="number"
            value={batMin}
            onChange={(e) => setBatMin(e.target.value)}
            placeholder="Pin từ (mAh)"
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
          <input
            type="number"
            value={batMax}
            onChange={(e) => setBatMax(e.target.value)}
            placeholder="Pin đến (mAh)"
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>Chỉ còn hàng</span>
          </label>
          <div className="flex items-center gap-2 md:col-span-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-1"
            >
              <option value="id">Sắp xếp: ID</option>
              <option value="name">Tên</option>
              <option value="brand">Hãng</option>
              <option value="battery">Pin</option>
              <option value="price">Giá</option>
              <option value="stock">Tồn</option>
              <option value="created_at">Ngày tạo</option>
            </select>
            <button
              onClick={() => setSortAsc((v) => !v)}
              className="px-3 py-2 rounded-xl border dark:border-zinc-700"
              title="Đảo chiều sắp xếp"
            >
              {sortAsc ? "↑" : "↓"}
            </button>
            <button
              onClick={startCreate}
              className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black"
            >
              Thêm mới
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b dark:border-zinc-700">
              <th className="p-2">ID</th>
              <th className="p-2">Tên</th>
              <th className="p-2">Hãng</th>
              <th className="p-2">IMEI</th>
              <th className="p-2">Pin (mAh)</th>
              <th className="p-2">Giá gốc ()</th>
              <th className="p-2">Tồn</th>
              <th className="p-2 w-44">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {phones.map((p) => (
              <tr key={p.id} className="border-b last:border-0 dark:border-zinc-800">
                <td className="p-2">{p.id}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.brand}</td>
                <td className="p-2">{p.imei}</td>
                <td className="p-2">{p.battery}</td>
                <td className="p-2">{p.price.toLocaleString("vi-VN")}</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="px-2 py-1 rounded-lg border dark:border-zinc-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => { setSellPhone(p); setPriceSold(p.price); }}
                      className="px-2 py-1 rounded-lg border border-green-400 text-green-600"
                    >
                      Bán
                    </button>
                    <button
                      onClick={() => requestDelete(p.id)}
                      className="px-2 py-1 rounded-lg border border-red-400 text-red-600"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && phones.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={8}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">Tổng tồn kho: <b>{totalStock}</b></div>

      {/* Modal thêm/sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-4">
            <h3 className="text-base font-semibold mb-3">
              {form.id ? "Sửa điện thoại" : "Thêm điện thoại"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">Tên
                <input className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="text-sm">Hãng
                <input className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </label>
              <label className="text-sm">IMEI
                <input className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} />
              </label>
              <label className="text-sm">Pin (mAh)
                <input type="number" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.battery} onChange={(e) => setForm({ ...form, battery: Number(e.target.value) })} />
              </label>
              <label className="text-sm">Giá gốc ()
                <input type="number" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </label>
              <label className="text-sm">Tồn kho
                <input type="number" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={cancelForm} className="px-3 py-2 rounded-xl border dark:border-zinc-700">Hủy</button>
              <button onClick={saveForm} className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black" disabled={loading}>
                {form.id ? "Lưu" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bán */}
      {sellPhone && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-4">
            <h3 className="text-base font-semibold mb-3">
              Bán: {sellPhone.name} (IMEI: {sellPhone.imei})
            </h3>
            <div className="space-y-3">
              <label className="text-sm block">Tên khách hàng
                <input className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </label>
              <label className="text-sm block">SĐT khách hàng
                <input className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </label>
              <label className="text-sm block">Giá bán ()
                <input type="number" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={priceSold} onChange={(e) => setPriceSold(Number(e.target.value))} />
              </label>
              <label className="text-sm block">Ngày bán
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSellPhone(null)} className="px-3 py-2 rounded-xl border dark:border-zinc-700">Hủy</button>
              <button onClick={handleSell} className="px-3 py-2 rounded-xl bg-green-600 text-white" disabled={loading}>Xác nhận bán</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xoá */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-5">
            <h3 className="text-base font-semibold mb-2">Xác nhận xoá</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bạn chắc chắn muốn xoá điện thoại này khỏi kho?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={cancelDelete} className="px-3 py-2 rounded-xl border dark:border-zinc-700">Hủy</button>
              <button onClick={confirmDelete} className="px-3 py-2 rounded-xl bg-red-600 text-white" disabled={confirmDeleting}>
                {confirmDeleting ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
