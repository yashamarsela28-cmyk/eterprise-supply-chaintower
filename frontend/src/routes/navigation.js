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
 * Enterprise Navigation Configuration
 * Grouped Multi-Echelon Information Architecture
 */
export const NAVIGATION_SECTIONS = [
  {
    title: 'CONTROL TOWER',
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        badge: 'Live'
      },
      {
        title: 'Analytics',
        path: '/analytics',
        icon: BarChart3
      }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      {
        title: 'Inventory',
        path: '/inventory',
        icon: Boxes
      },
      {
        title: 'Orders',
        path: '/orders',
        icon: ShoppingCart
      },
      {
        title: 'Shipments',
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
    title: 'PROCUREMENT',
    items: [
      {
        title: 'Suppliers',
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
    title: 'MASTER DATA',
    items: [
      {
        title: 'Products',
        path: '/products',
        icon: Package
      },
      {
        title: 'Customers',
        path: '/customers',
        icon: Users
      },
      {
        title: 'Warehouses',
        path: '/warehouses',
        icon: Warehouse
      }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      {
        title: 'Invoices',
        path: '/invoices',
        icon: Receipt
      },
      {
        title: 'Payments',
        path: '/payments',
        icon: CreditCard
      }
    ]
  },
  {
    title: 'QUALITY & RETURNS',
    items: [
      {
        title: 'Returns',
        path: '/returns',
        icon: RotateCcw
      }
    ]
  }
];

export default NAVIGATION_SECTIONS;
