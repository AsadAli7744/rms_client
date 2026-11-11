import { api } from '@/lib/api/client';
import type { Order, CreateOrderInput, OrderStatus, PaymentStatus } from '@/lib/types/orders';
import type { PaginatedResponse } from '@/lib/types/common';
import type { ItemSalesReportResponse, SalesSummaryResponse } from '@/lib/types/reports';
import { getStoredCache, setStoredCache, invalidateStoredCache } from '@/lib/cache/browser-cache';

export async function fetchOrders(params: {
  branch_id?: number;
  restaurant_id?: number;
  status?: string;
  source?: string;
  table_id?: number;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get('/orders', { params });
  return data;
}

export async function fetchOrder(id: number): Promise<Order> {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post('/orders', input);
  return data;
}

export async function updateOrderStatus(
  id: number,
  body: {
    status: OrderStatus;
    payment_status?: PaymentStatus;
    payment_method?: string;
    paid_amount?: number;
  },
): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/status`, body);
  return data;
}

export async function applyOrderDiscount(
  id: number,
  body: {
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_reason?: string;
  },
): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/discount`, body);
  return data;
}

export async function markOrderPrinted(id: number): Promise<Order> {
  const { data } = await api.post(`/orders/${id}/print`);
  return data;
}

export async function cancelOrder(id: number, reason?: string): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/cancel`, { reason });
  return data;
}

export async function purchaseStock(body: {
  item_id: number;
  quantity: number;
  unit_cost?: number;
  supplier?: string;
  notes?: string;
}): Promise<any> {
  const { data } = await api.post('/menu-items/stock/purchase', body);
  invalidateStoredCache('menu-items');
  return data;
}

export async function fetchTableActiveOrder(
  tableId: number,
): Promise<{ activeOrder: Order | null; queuedOrders: Order[] }> {
  const { data } = await api.get(`/orders/table/${tableId}/active`);
  return data;
}

export async function fetchKitchenTickets(
  branchId: number,
  station?: string,
): Promise<(Order & { elapsed_minutes: number })[]> {
  const { data } = await api.get('/kitchen/tickets', {
    params: { branchId, station },
  });
  return data;
}

export async function updateKitchenItemStatus(
  itemId: number,
  status: string,
): Promise<any> {
  const { data } = await api.patch(`/kitchen/items/${itemId}/status`, { status });
  return data;
}

export async function fetchItemSalesReport(params: {
  branch_id: number;
  item_ids?: string;
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'total';
}): Promise<ItemSalesReportResponse> {
  const { data } = await api.get('/reports/item-sales', { params });
  return data;
}

export async function fetchSalesSummaryReport(params: {
  branch_id: number;
  start_date?: string;
  end_date?: string;
}): Promise<SalesSummaryResponse> {
  const { data } = await api.get('/reports/sales-summary', { params });
  return data;
}

export async function fetchMenuItems(restaurantId?: number): Promise<any[]> {
  const cacheKey = `menu-items:${restaurantId || 'all'}`;
  try {
    const { data } = await api.get('/menu-items', {
      params: { restaurant_id: restaurantId, limit: 100 },
    });
    const items = data.data ?? [];
    setStoredCache(cacheKey, items, 30);
    return items;
  } catch (err) {
    const cached = getStoredCache<any[]>(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

export async function fetchDiningTables(branchId: number): Promise<any[]> {
  const { data } = await api.get(`/branches/${branchId}/tables`);
  return data ?? [];
}

export async function fetchMenuCategories(restaurantId?: number): Promise<any[]> {
  const cacheKey = `menu-categories:${restaurantId || 'all'}`;
  try {
    const { data } = await api.get('/menu-categories', {
      params: { restaurant_id: restaurantId, limit: 100 },
    });
    const categories = data.data ?? [];
    setStoredCache(cacheKey, categories, 60);
    return categories;
  } catch (err) {
    const cached = getStoredCache<any[]>(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

export async function createMenuCategory(payload: {
  restaurant_id: number;
  name: string;
  slug?: string;
  description?: string;
}): Promise<any> {
  const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const { data } = await api.post('/menu-categories', { ...payload, slug });
  invalidateStoredCache('menu-categories');
  return data;
}

export async function createMenuItem(payload: {
  restaurant_id: number;
  category_id: number;
  name: string;
  slug?: string;
  base_price: number;
  sku?: string;
  track_stock?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  preparation_station_type?: string;
  short_description?: string;
}): Promise<any> {
  const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
  const { data } = await api.post('/menu-items', { ...payload, slug });
  invalidateStoredCache('menu-items');
  return data;
}

export async function updateMenuItem(id: number, payload: Partial<{
  name: string;
  base_price: number;
  category_id: number;
  sku: string;
  track_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}>): Promise<any> {
  const { data } = await api.patch(`/menu-items/${id}`, payload);
  invalidateStoredCache('menu-items');
  return data;
}
