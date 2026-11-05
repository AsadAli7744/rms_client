export type OrderSource = 'pos' | 'web' | 'phone' | 'admin';

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'partially_ready'
  | 'ready'
  | 'served'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'voided';

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'success'
  | 'paid'
  | 'partial'
  | 'failed'
  | 'refunded'
  | 'voided';

export type KitchenItemStatus =
  | 'queued'
  | 'in_preparation'
  | 'ready'
  | 'served'
  | 'cancelled';

export type OrderItem = {
  id: number;
  order_id: number;
  item_id: number;
  item_name: string;
  variant_id?: number | null;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  station_type: string;
  status: KitchenItemStatus;
  notes?: string | null;
};

export type Order = {
  id: number;
  restaurant_id: number;
  branch_id: number;
  table_id?: number | null;
  table?: { id: number; code: string; name?: string | null } | null;
  order_number: string;
  source: OrderSource;
  status: OrderStatus;
  subtotal: number;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value: number;
  discount_amount: number;
  discount_reason?: string | null;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  waiter_name?: string | null;
  cashier_name?: string | null;
  is_queued: boolean;
  queue_number?: number | null;
  notes?: string | null;
  printed_at?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

export type CreateOrderItemInput = {
  item_id: number;
  variant_id?: number | null;
  quantity: number;
  notes?: string | null;
};

export type CreateOrderInput = {
  restaurant_id: number;
  branch_id: number;
  table_id?: number | null;
  source?: OrderSource;
  customer_name?: string | null;
  customer_phone?: string | null;
  waiter_name?: string | null;
  cashier_name?: string | null;
  notes?: string | null;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_value?: number;
  discount_reason?: string | null;
  is_queued?: boolean;
  actor_role?: string;
  items: CreateOrderItemInput[];
};
