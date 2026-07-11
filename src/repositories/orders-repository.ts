export interface OrderVariantSnapshot {
  color: string;
  size: string;
  price: number | null;
  quantity: number; // estoque atual da variante
  product_name: string;
  product_price: number;
  product_promotional_price: number | null;
}

export interface ResolvedOrderItem {
  variant_id: number;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderData {
  name: string;
  phone: string;
  email?: string | null;
  payment_method?: string;
  message?: string | null;
  notes?: string | null;
  total: number;
}

export interface OrderSummary {
  id: number;
  name: string;
  phone: string;
  total: number;
  status: string;
  created_at: Date;
}

export interface OrderItemView {
  id: number;
  variant_id: number;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderDetail extends OrderSummary {
  email: string | null;
  payment_method: string;
  message: string | null;
  notes: string | null;
  items: OrderItemView[];
}

export interface ListOrdersFilters {
  status?: string;
  // inclusive lower bound / exclusive upper bound on created_at
  createdFrom?: Date;
  createdBefore?: Date;
  page: number;
  limit: number;
}

export interface OrderListResult {
  items: OrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersRepository {
  // snapshot used to freeze item details + resolve price; null when missing
  findVariantSnapshot(variantId: number): Promise<OrderVariantSnapshot | null>;
  create(
    data: CreateOrderData,
    items: ResolvedOrderItem[],
  ): Promise<OrderDetail>;
  list(filters: ListOrdersFilters): Promise<OrderListResult>;
  findById(id: number): Promise<OrderDetail | null>;
  updateStatus(id: number, status: string): Promise<OrderDetail | null>;
}
