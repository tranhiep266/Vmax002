import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type CustomerRow = {
  id: number;
  customer_name: string;
  customer_phone: string;
  device_name: string;
  brand: string;
  battery: number;
  imei: string;
  price_original: number;
  price_sold: number;
  sold_at: string;
};

type SortKey = "sold_at" | "price_sold" | "price_original" | "brand" | "device_name";

export default function Customers() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🔎 Filters
  const [q, setQ] = useState("");
  const [brandF, setBrandF] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortKey>("sold_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Modal xác nhận xoá
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

  const load = async () => {
    setError(null);
    let query = supabase.from("customers").select("*");

    const raw = q.trim();
    if (raw) {
      const esc = raw
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      const parts = [
        `customer_name.ilike.%${esc}%`,
        `customer_phone.ilike.%${esc}%`,
        `imei.ilike.%${esc}%`,
        `device_name.ilike.%${esc}%`,
        `brand.ilike.%${esc}%`,
      ];
      query = query.or(parts.join(","));
    }

    if (brandF.trim()) query = query.ilike("brand", `%${brandF.trim()}%`);

    const pMin = priceMin.trim() === "" ? null : Number(priceMin);
    const pMax = priceMax.trim() === "" ? null : Number(priceMax);
    if (pMin !== null && !Number.isNaN(pMin)) query = query.gte("price_sold", pMin);
    if (pMax !== null && !Number.isNaN(pMax)) query = query.lte("price_sold", pMax);

    if (dateFrom) query = query.gte("sold_at", new Date(dateFrom + "T00:00:00").toISOString());
    if (dateTo)   query = query.lte("sold_at", new Date(dateTo   + "T23:59:59").toISOString());

    query = query.order(sortBy, { ascending: sortAsc });

    const { data, error } = await query;
    if (error) setError(error.message);
    setRows((data as any) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, brandF, dateFrom, dateTo, priceMin, priceMax, sortBy, sortAsc]);

  const requestDelete = (id: number) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    setConfirmDeleting(true);
    try {
      const { error } = await supabase.from("customers").delete().eq("id", confirmDeleteId);
      if (error) throw error;
      setConfirmDeleteId(null);
      await load();
    } catch (e: any) {
      setError(e.message || "Xoá thất bại");
    } finally {
      setConfirmDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Khách hàng</h2>

      {/* 🔎 Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <input
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-3"
          placeholder="Tìm tên/SĐT/IMEI/tên máy/hãng..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          placeholder="Hãng..."
          value={brandF}
          onChange={(e) => setBrandF(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <input
          type="number"
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-1"
          placeholder="Giá từ"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          type="number"
          className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-1"
          placeholder="Giá đến"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
        <div className="flex items-center gap-2 md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-1"
          >
            <option value="sold_at">Sắp xếp: Ngày mua</option>
            <option value="price_sold">Giá bán</option>
            <option value="price_original">Giá gốc</option>
            <option value="brand">Hãng</option>
            <option value="device_name">Tên máy</option>
          </select>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="px-3 py-2 rounded-xl border dark:border-zinc-700"
            title="Đảo chiều sắp xếp"
          >
            {sortAsc ? "↑" : "↓"}
          </button>
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
              <th className="p-2">Ngày bán</th>
              <th className="p-2">Khách hàng</th>
              <th className="p-2">SĐT</th>
              <th className="p-2">Thiết bị</th>
              <th className="p-2">Hãng</th>
              <th className="p-2">Pin (mAh)</th>
              <th className="p-2">IMEI</th>
              <th className="p-2">Giá gốc (₫)</th>
              <th className="p-2">Giá bán (₫)</th>
              <th className="p-2 w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 dark:border-zinc-800">
                <td className="p-2">{new Date(r.sold_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-2">{r.customer_name}</td>
                <td className="p-2">{r.customer_phone}</td>
                <td className="p-2">{r.device_name}</td>
                <td className="p-2">{r.brand}</td>
                <td className="p-2">{r.battery}</td>
                <td className="p-2">{r.imei}</td>
                <td className="p-2">{r.price_original.toLocaleString("vi-VN")}</td>
                <td className="p-2">{r.price_sold.toLocaleString("vi-VN")}</td>
                <td className="p-2">
                  <button
                    onClick={() => requestDelete(r.id)}
                    className="px-2 py-1 rounded-lg border border-red-400 text-red-600"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={10}>Không có kết quả</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xác nhận xoá */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-5">
            <h3 className="text-base font-semibold mb-2">Xác nhận xoá</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bạn chắc chắn muốn xoá bản ghi khách hàng này?</p>
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
