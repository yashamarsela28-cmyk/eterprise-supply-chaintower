import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  DashboardPage,
  AnalyticsPage,
  InventoryPage,
  WarehousesPage,
  TransfersPage,
  ProductsPage,
  SuppliersPage,
  PurchaseOrdersPage,
  GoodsReceiptsPage,
  OrdersPage,
  ShipmentsPage,
  CustomersPage,
  InvoicesPage,
  PaymentsPage,
  ReturnsPage,
  NotFoundPage
} from '../pages';

/**
 * Enterprise Application Routes Configuration
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Default Redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Executive & Analytics */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* Inventory & Facilities */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="products" element={<ProductsPage />} />

        {/* Procurement */}
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="goods-receipts" element={<GoodsReceiptsPage />} />

        {/* Fulfillment & Logistics */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="customers" element={<CustomersPage />} />

        {/* Finance & Post-Sale */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="returns" element={<ReturnsPage />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
