import {
  LayoutDashboard,
  BarChart3,
  Boxes,
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  Building2,
  FileSpreadsheet,
  PackageCheck,
  Package,
  Users,
  Warehouse,
  Receipt,
  CreditCard,
  RotateCcw
} from 'lucide-react';

/**
 * Enterprise Navigation Hierarchy
 * Structured strictly by supply-chain operational domains
 */
export const NAVIGATION_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      {
        title: 'Control Tower',
        path: '/dashboard',
        icon: LayoutDashboard,
        badge: 'LIVE'
      },
      {
        title: 'Analytics & KPIs',
        path: '/analytics',
        icon: BarChart3
      }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      {
        title: 'Sales Orders',
        path: '/orders',
        icon: ShoppingCart
      },
      {
        title: 'Shipments & Tracking',
        path: '/shipments',
        icon: Truck
      },
      {
        title: 'Stock Transfers',
        path: '/transfers',
        icon: ArrowLeftRight
      }
    ]
  },
  {
    title: 'INVENTORY & HUBS',
    items: [
      {
        title: 'Inventory Control',
        path: '/inventory',
        icon: Boxes
      },
      {
        title: 'Products & SKUs',
        path: '/products',
        icon: Package
      },
      {
        title: 'Warehouses',
        path: '/warehouses',
        icon: Warehouse
      }
    ]
  },
  {
    title: 'PROCUREMENT',
    items: [
      {
        title: 'Suppliers Directory',
        path: '/suppliers',
        icon: Building2
      },
      {
        title: 'Purchase Orders',
        path: '/purchase-orders',
        icon: FileSpreadsheet
      },
      {
        title: 'Goods Receipts',
        path: '/goods-receipts',
        icon: PackageCheck
      }
    ]
  },
  {
    title: 'FINANCE & ACCOUNTS',
    items: [
      {
        title: 'Invoices & AR',
        path: '/invoices',
        icon: Receipt
      },
      {
        title: 'Payment Journal',
        path: '/payments',
        icon: CreditCard
      },
      {
        title: 'Customers Directory',
        path: '/customers',
        icon: Users
      }
    ]
  },
  {
    title: 'QUALITY & RETURNS',
    items: [
      {
        title: 'Returns & RMA',
        path: '/returns',
        icon: RotateCcw
      }
    ]
  }
];

export default NAVIGATION_SECTIONS;
