import { NavLink } from "react-router-dom";
import { ReactNode, useState } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const linkBase =
    "block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800";
  const linkActive = "bg-gray-200 dark:bg-zinc-700";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar */}
      <aside className={`transition-all ${open ? "w-64" : "w-16"} p-3`}>
        <button
          className="w-full mb-3 rounded-xl border dark:border-zinc-700 py-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Thu gọn" : "Mở"}
        </button>
        <nav className="space-y-2">
          <NavLink to="/" className={({isActive}) => `${linkBase} ${isActive?linkActive:""}`}>Tổng quan</NavLink>
          <NavLink to="/phones" className={({isActive}) => `${linkBase} ${isActive?linkActive:""}`}>Điện thoại</NavLink>
          <NavLink to="/brands" className={({isActive}) => `${linkBase} ${isActive?linkActive:""}`}>Hãng</NavLink>
          <NavLink to="/customers" className={({isActive}) => `${linkBase} ${isActive?linkActive:""}`}>Khách hàng</NavLink>
          <NavLink to="/sales" className={({isActive}) => `${linkBase} ${isActive?linkActive:""}`}>Lịch sử bán</NavLink>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Phone Admin</h1>
        </header>
        <div className="rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
