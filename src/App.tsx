import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Phones from "./pages/Phones";
import Brands from "./pages/Brands";
import Customers from "./pages/Customers";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/phones" element={<Phones />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
