import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Sale = {
  id: number;
  phone_id: number;
  imei: string | null;
  customer_name: string;
  customer_phone: string;
  price_at_sale: number;
  sold_at: string;
  phone?: { name: string };
};

export default function Sales() {
  const [rows, setRows] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("sales")
      .select("*, phone:phones(name)")
      .order("sold_at", { ascending: false });
    if (error) setError(error.message);
    setRows((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Lịch sử bán</h2>
      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-900">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b dark:border-zinc-700">
              <th className="p-2">Thời gian</th>
              <th className="p-2">Điện thoại</th>
              <th className="p-2">IMEI</th>
              <th className="p-2">Khách hàng</th>
              <th className="p-2">SĐT</th>
              <th className="p-2">Giá (₫)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 dark:border-zinc-800">
                <td className="p-2">{new Date(r.sold_at).toLocaleString("vi-VN")}</td>
                <td className="p-2">{(r as any).phone?.name || r.phone_id}</td>
                <td className="p-2">{r.imei || "-"}</td>
                <td className="p-2">{r.customer_name}</td>
                <td className="p-2">{r.customer_phone}</td>
                <td className="p-2">{r.price_at_sale.toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={6}>
                  Chưa có giao dịch
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
