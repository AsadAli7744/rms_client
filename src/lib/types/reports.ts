export type ItemSalesRow = {
  item_id: number;
  item_name: string;
  category_name: string;
  sku: string | null;
  total_quantity: number;
  total_revenue: number;
  orders_count: number;
  avg_price_per_unit: number;
};

export type ItemSalesTimelineEntry = {
  date: string;
  total_quantity: number;
  total_revenue: number;
  items: {
    item_id: number;
    item_name: string;
    quantity: number;
    revenue: number;
  }[];
};

export type ItemSalesReportResponse = {
  branch_id: number;
  filters: {
    item_ids: number[];
    start_date: string | null;
    end_date: string | null;
    period: 'daily' | 'weekly' | 'monthly' | 'total';
  };
  summary: {
    total_units_sold: number;
    total_revenue: number;
    distinct_items_count: number;
  };
  items: ItemSalesRow[];
  timeline: ItemSalesTimelineEntry[];
};

export type SalesSummaryResponse = {
  branch_id: number;
  date_range: {
    start_date: string | null;
    end_date: string | null;
  };
  metrics: {
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    gross_sales: number;
    total_discounts: number;
    discounted_orders_count: number;
    avg_discount_per_order: number;
    net_sales: number;
    total_tax: number;
    total_paid: number;
  };
  discounts_by_reason: {
    reason: string;
    count: number;
    total_amount: number;
  }[];
  payment_methods_breakdown: Record<string, number>;
};
