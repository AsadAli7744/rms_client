import { api } from '@/lib/api/client';
import type { Order, CreateOrderInput, OrderStatus, PaymentStatus } from '@/lib/types/orders';
import type { PaginatedResponse } from '@/lib/types/common';
import type { ItemSalesReportResponse, SalesSummaryResponse } from '@/lib/types/reports';

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
  const { data } = await api.get('/menu-items', {
    params: { restaurant_id: restaurantId, limit: 100 },
  });
  return data.data ?? [];
}

export async function fetchDiningTables(branchId: number): Promise<any[]> {
  const { data } = await api.get(`/branches/${branchId}/dining-tables`);
  return data ?? [];
}
