export type Language = 'ka' | 'en';

export type Unit = string;

export type Department = 'restaurant' | 'bar' | 'breakfast' | 'housekeeping';

export interface Product {
  id: string;
  code?: string;
  name: string;
  unit: string;
  category: string;
  minBalance: number;
  department?: Department;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  supplier?: string;
  department?: Department;
}

export interface Ingredient {
  productId: string;
  quantity: number;
  lossPercentage?: number;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
  salePrice: number;
  department?: Department;
}

export interface Sale {
  id: string;
  date: string;
  dishId: string;
  quantity: number;
  totalRevenue: number;
  department?: Department;
  debtor?: string;
}

export interface InventoryAudit {
  id: string;
  date: string;
  balances: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface SupplierPayment {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  note: string;
}

export interface CustomerPayment {
  id: string;
  customer: string;
  date: string;
  amount: number;
  note: string;
}

// ====== BREAKFAST ======

export interface BreakfastIngredient {
  productId: string;
  quantity: number;
  lossPercentage?: number;
}

export interface BreakfastDayMenu {
  ingredients: BreakfastIngredient[];
  pricePerGuest: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WeeklyBreakfastMenus = Record<DayOfWeek, BreakfastDayMenu>;

export interface BreakfastLog {
  id: string;
  date: string;
  roomNumber: string;
  guestCount: number;
  dayOfWeek: DayOfWeek;
  debtor?: string;
  totalRevenue: number;
}

// ====== HOUSEKEEPING ======

export interface HousekeepingBOMItem {
  productId: string;
  quantity: number;
}

export type RoomStatus = 'clean' | 'dirty' | 'in_progress';

export interface Room {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  guestCount: number;
}

export interface HousekeepingLog {
  id: string;
  date: string;
  roomId: string;
  roomNumber: string;
  guestCount: number;
}

// ====== DIRECT CONSUMPTION (for inventory tracking) ======

export interface DirectConsumption {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  source: 'breakfast' | 'housekeeping';
  reference: string;
}