import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Product, Purchase, Sale, Dish, Language, InventoryAudit, Ingredient, ActivityLog,
  SupplierPayment, CustomerPayment, BreakfastDayMenu, DayOfWeek, WeeklyBreakfastMenus, BreakfastLog,
  HousekeepingBOMItem, Room, RoomStatus, HousekeepingLog, DirectConsumption, BreakfastIngredient, Department,
  User, TenantData
} from './types';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyDayMenu = (): BreakfastDayMenu => ({ ingredients: [], pricePerGuest: 0 });

const defaultWeeklyMenus = (): WeeklyBreakfastMenus => ({
  monday: emptyDayMenu(), tuesday: emptyDayMenu(), wednesday: emptyDayMenu(),
  thursday: emptyDayMenu(), friday: emptyDayMenu(), saturday: emptyDayMenu(), sunday: emptyDayMenu(),
});

const createEmptyTenantData = (): TenantData => ({
  products: [],
  purchases: [],
  sales: [],
  dishes: [],
  inventoryAudits: [],
  activityLogs: [],
  supplierPayments: [],
  customerPayments: [],
  breakfastMenus: defaultWeeklyMenus(),
  breakfastLogs: [],
  housekeepingBOM: [],
  rooms: [],
  housekeepingLogs: [],
  directConsumptions: [],
});

interface AppState {
  language: Language;
  users: User[];
  currentUserId: string | null;
  isAuthenticated: boolean;

  // Auth & settings
  setLanguage: (lang: Language) => void;
  login: (id: string, password: string) => boolean;
  register: (id: string, password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  updatePassword: (current: string, newPass: string) => boolean;
  addLog: (action: string, details: string) => void;
  clearLogs: () => void;

  // Accessors (Scoped to currentUserId)
  getCurrentUser: () => User | undefined;
  getProducts: () => Product[];
  getPurchases: () => Purchase[];
  getSales: () => Sale[];
  getDishes: () => Dish[];
  getInventoryAudits: () => InventoryAudit[];
  getActivityLogs: () => ActivityLog[];
  getSupplierPayments: () => SupplierPayment[];
  getCustomerPayments: () => CustomerPayment[];
  getBreakfastMenus: () => WeeklyBreakfastMenus;
  getBreakfastLogs: () => BreakfastLog[];
  getHousekeepingBOM: () => HousekeepingBOMItem[];
  getRooms: () => Room[];
  getHousekeepingLogs: () => HousekeepingLog[];
  getDirectConsumptions: () => DirectConsumption[];

  // Actions (Scoped to currentUserId)
  updateProductMinBalance: (id: string, minBalance: number) => void;
  addProduct: (product: Product) => void;
  addDish: (dish: Dish) => void;
  editDish: (id: string, dish: Dish) => void;
  deleteDish: (id: string) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }) => void;
  editPurchase: (id: string, purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }) => void;
  bulkAddPurchases: (purchases: Array<Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }>) => void;
  deletePurchase: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  editSale: (id: string, sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  deleteSale: (id: string) => void;
  saveInventoryAudit: (audit: Omit<InventoryAudit, 'id'>) => void;
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => void;
  editSupplierPayment: (id: string, payment: Omit<SupplierPayment, 'id'>) => void;
  deleteSupplierPayment: (id: string) => void;
  addCustomerPayment: (payment: Omit<CustomerPayment, 'id'>) => void;
  editCustomerPayment: (id: string, payment: Omit<CustomerPayment, 'id'>) => void;
  deleteCustomerPayment: (id: string) => void;
  saveBreakfastMenu: (day: DayOfWeek, menu: BreakfastDayMenu) => void;
  logBreakfast: (roomNumber: string, guestCount: number, debtor?: string) => void;
  deleteBreakfastLog: (id: string) => void;
  saveHousekeepingBOM: (items: HousekeepingBOMItem[]) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  deleteRoom: (id: string) => void;
  updateRoomStatus: (id: string, status: RoomStatus, guestCount?: number) => void;
  deleteHousekeepingLog: (id: string) => void;

  // System
  clearAllData: () => void;
  restoreData: (data: Partial<TenantData>) => void;
  executeChefsGrandOpeningTest: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
  const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
  return netQuantity / (1 - (validLoss / 100));
};

const getDayOfWeek = (dateStr: string): DayOfWeek => {
  const d = new Date(dateStr);
  const jsDay = d.getDay(); // 0=Sunday
  return DAYS[jsDay === 0 ? 6 : jsDay - 1];
};

const updateUser = (set: any, get: any, updater: (data: TenantData) => Partial<TenantData>) => {
  const state = get();
  const userId = state.currentUserId;
  if (!userId) return;
  
  set((state: AppState) => ({
    users: state.users.map(u => u.id === userId ? { ...u, data: { ...u.data, ...updater(u.data) } } : u)
  }));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'ka',
      users: [
        {
          id: '0000000',
          password: '111979',
          isFirstLogin: true,
          data: createEmptyTenantData()
        }
      ],
      currentUserId: null,
      isAuthenticated: false,

      setLanguage: (lang) => set({ language: lang }),

      login: (id, password) => {
        const state = get();
        const user = state.users.find(u => u.id === id);
        if (user && user.password === password) {
          set({ currentUserId: id, isAuthenticated: true });
          get().addLog('User Login', `Successful authentication for ${id}`);
          return true;
        }
        // Special case for new user registration with master password
        if (!user && password === '111979') {
          set({ currentUserId: id, isAuthenticated: true });
          get().addLog('Master Login', `Master password used for new ID ${id}`);
          return true;
        }
        return false;
      },

      register: (id, password) => {
        const state = get();
        if (state.users.find(u => u.id === id)) return false;
        
        const newUser: User = {
          id,
          password,
          isFirstLogin: false,
          data: createEmptyTenantData()
        };
        
        set({
          users: [...state.users, newUser],
          currentUserId: id,
          isAuthenticated: true
        });
        get().addLog('User Registered', `New company ID ${id} registered`);
        return true;
      },

      logout: () => {
        set({ currentUserId: null, isAuthenticated: false });
        get().addLog('User Logout', 'User ended session');
      },

      changePassword: (newPassword) => {
        const state = get();
        const userId = state.currentUserId;
        if (!userId) return;
        
        set({
          users: state.users.map(u => u.id === userId ? { ...u, password: newPassword, isFirstLogin: false } : u)
        });
        get().addLog('Password Changed', 'User updated initial password');
      },

      updatePassword: (current, newPass) => {
        const state = get();
        const userId = state.currentUserId;
        if (!userId) return false;
        
        const user = state.users.find(u => u.id === userId);
        if (user && user.password === current) {
          set({
            users: state.users.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: false } : u)
          });
          get().addLog('Password Changed', 'User manually updated password');
          return true;
        }
        return false;
      },

      addLog: (action, details) => {
        const userId = get().currentUserId;
        updateUser(set, get, (data) => ({
          activityLogs: [
            { id: generateId(), timestamp: new Date().toISOString(), action, details, user: userId || 'System' },
            ...data.activityLogs
          ]
        }));
      },

      clearLogs: () => updateUser(set, get, () => ({ activityLogs: [] })),

      // Accessors
      getCurrentUser: () => get().users.find(u => u.id === get().currentUserId),
      getProducts: () => get().getCurrentUser()?.data.products || [],
      getPurchases: () => get().getCurrentUser()?.data.purchases || [],
      getSales: () => get().getCurrentUser()?.data.sales || [],
      getDishes: () => get().getCurrentUser()?.data.dishes || [],
      getInventoryAudits: () => get().getCurrentUser()?.data.inventoryAudits || [],
      getActivityLogs: () => get().getCurrentUser()?.data.activityLogs || [],
      getSupplierPayments: () => get().getCurrentUser()?.data.supplierPayments || [],
      getCustomerPayments: () => get().getCurrentUser()?.data.customerPayments || [],
      getBreakfastMenus: () => get().getCurrentUser()?.data.breakfastMenus || defaultWeeklyMenus(),
      getBreakfastLogs: () => get().getCurrentUser()?.data.breakfastLogs || [],
      getHousekeepingBOM: () => get().getCurrentUser()?.data.housekeepingBOM || [],
      getRooms: () => get().getCurrentUser()?.data.rooms || [],
      getHousekeepingLogs: () => get().getCurrentUser()?.data.housekeepingLogs || [],
      getDirectConsumptions: () => get().getCurrentUser()?.data.directConsumptions || [],

      // Actions
      updateProductMinBalance: (id, minBalance) => {
        const product = get().getProducts().find(p => p.id === id);
        updateUser(set, get, (data) => ({
          products: data.products.map(p => p.id === id ? { ...p, minBalance } : p)
        }));
        get().addLog('Min Balance Updated', `${product?.name || id} set to ${minBalance}`);
      },

      addProduct: (product) => {
        updateUser(set, get, (data) => ({ products: [...data.products, product] }));
        get().addLog('Product Created', `${product.name} (${product.unit})`);
      },

      addDish: (dish) => {
        updateUser(set, get, (data) => ({ dishes: [...data.dishes, dish] }));
        get().addLog('Dish Created', dish.name);
      },

      editDish: (id, dish) => {
        updateUser(set, get, (data) => ({ dishes: data.dishes.map(d => d.id === id ? dish : d) }));
        get().addLog('Dish Edited', dish.name);
      },

      deleteDish: (id) => {
        const dish = get().getDishes().find(d => d.id === id);
        updateUser(set, get, (data) => ({ dishes: data.dishes.filter(d => d.id !== id) }));
        get().addLog('Dish Deleted', dish?.name || id);
      },

      deletePurchase: (id) => {
        const purchase = get().getPurchases().find(p => p.id === id);
        const product = get().getProducts().find(p => p.id === purchase?.productId);
        updateUser(set, get, (data) => ({ purchases: data.purchases.filter(p => p.id !== id) }));
        get().addLog('Purchase Deleted', `${product?.name || 'Unknown'} x${purchase?.quantity || 0}`);
      },

      addSale: (saleData) => {
        const dish = get().getDishes().find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;
        updateUser(set, get, (data) => ({ sales: [...data.sales, { id: generateId(), ...saleData, totalRevenue }] }));
        get().addLog('Sale Added', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      editSale: (id, saleData) => {
        const dish = get().getDishes().find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;
        updateUser(set, get, (data) => ({ sales: data.sales.map(s => s.id === id ? { ...s, ...saleData, totalRevenue } : s) }));
        get().addLog('Sale Edited', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      deleteSale: (id) => {
        const sale = get().getSales().find(s => s.id === id);
        const dish = get().getDishes().find(d => d.id === sale?.dishId);
        updateUser(set, get, (data) => ({ sales: data.sales.filter(s => s.id !== id) }));
        get().addLog('Sale Deleted', `${dish?.name || 'Unknown'} x${sale?.quantity || 0}`);
      },

      addPurchase: (purchaseData) => {
        const products = get().getProducts();
        let existingProduct = products.find(p => 
          p.name.toLowerCase() === purchaseData.productName.toLowerCase() && 
          (p.department || 'restaurant') === (purchaseData.department || 'restaurant')
        );
        
        let productId = existingProduct?.id;
        updateUser(set, get, (data) => {
          let newProducts = [...data.products];
          if (!existingProduct) {
            productId = generateId();
            newProducts.push({ id: productId, code: purchaseData.code, name: purchaseData.productName, unit: purchaseData.unit, category: purchaseData.category, minBalance: 0, department: purchaseData.department });
          } else if (purchaseData.code && !existingProduct.code) {
            newProducts = newProducts.map(p => p.id === existingProduct!.id ? { ...p, code: purchaseData.code } : p);
          }
          
          return {
            products: newProducts,
            purchases: [...data.purchases, { id: generateId(), date: purchaseData.date, productId: productId!, quantity: purchaseData.quantity, price: purchaseData.price, total: purchaseData.quantity * purchaseData.price, supplier: purchaseData.supplier || '', department: purchaseData.department }],
          };
        });
        get().addLog('Purchase Added', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      editPurchase: (id, purchaseData) => {
        const products = get().getProducts();
        let existingProduct = products.find(p => 
          p.name.toLowerCase() === purchaseData.productName.toLowerCase() && 
          (p.department || 'restaurant') === (purchaseData.department || 'restaurant')
        );
        
        let productId = existingProduct?.id;
        updateUser(set, get, (data) => {
          let newProducts = [...data.products];
          if (!existingProduct) {
            productId = generateId();
            newProducts.push({ id: productId, code: purchaseData.code, name: purchaseData.productName, unit: purchaseData.unit, category: purchaseData.category, minBalance: 0, department: purchaseData.department });
          } else if (purchaseData.code && !existingProduct.code) {
            newProducts = newProducts.map(p => p.id === existingProduct!.id ? { ...p, code: purchaseData.code } : p);
          }
          
          return {
            products: newProducts,
            purchases: data.purchases.map(p => p.id === id ? { ...p, date: purchaseData.date, productId: productId!, quantity: purchaseData.quantity, price: purchaseData.price, total: purchaseData.quantity * purchaseData.price, supplier: purchaseData.supplier || '', department: purchaseData.department } : p),
          };
        });
        get().addLog('Purchase Edited', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      bulkAddPurchases: (bulkPurchases) => {
        updateUser(set, get, (data) => {
          let newProducts = [...data.products];
          let newPurchases = [...data.purchases];
          bulkPurchases.forEach(pd => {
            let ep = newProducts.find(p => 
              p.name.toLowerCase() === pd.productName.toLowerCase() && 
              (p.department || 'restaurant') === (pd.department || 'restaurant')
            );
            let pid = ep?.id;
            if (!ep) {
              pid = generateId();
              newProducts.push({ id: pid, code: pd.code, name: pd.productName, unit: pd.unit, category: pd.category || 'General', minBalance: 0, department: pd.department });
            } else if (pd.code && !ep.code) { 
              newProducts = newProducts.map(p => p.id === ep!.id ? { ...p, code: pd.code } : p);
            }
            newPurchases.push({ id: generateId(), date: pd.date, productId: pid!, quantity: pd.quantity, price: pd.price, total: pd.quantity * pd.price, supplier: pd.supplier || '', department: pd.department });
          });
          return { products: newProducts, purchases: newPurchases };
        });
        get().addLog('Bulk Import', `${bulkPurchases.length} purchases imported from Excel`);
      },

      saveInventoryAudit: (audit) => {
        updateUser(set, get, (data) => {
          const idx = data.inventoryAudits.findIndex(a => a.date === audit.date && a.department === audit.department);
          const newAudits = [...data.inventoryAudits];
          if (idx >= 0) { newAudits[idx] = { ...newAudits[idx], balances: audit.balances }; }
          else { newAudits.push({ id: generateId(), ...audit }); }
          return { inventoryAudits: newAudits };
        });
        get().addLog('Inventory Saved', `Audit for date ${audit.date} (${audit.department || 'restaurant'})`);
      },

      // === SUPPLIER PAYMENTS ===
      addSupplierPayment: (data) => {
        updateUser(set, get, (tenantData) => ({ supplierPayments: [...tenantData.supplierPayments, { id: generateId(), ...data }] }));
        get().addLog('Payment Added', `${data.supplier}: ${data.amount}`);
      },
      editSupplierPayment: (id, data) => {
        updateUser(set, get, (tenantData) => ({ supplierPayments: tenantData.supplierPayments.map(p => p.id === id ? { ...p, ...data } : p) }));
        get().addLog('Payment Edited', `${data.supplier}: ${data.amount}`);
      },
      deleteSupplierPayment: (id) => {
        const p = get().getSupplierPayments().find(x => x.id === id);
        updateUser(set, get, (tenantData) => ({ supplierPayments: tenantData.supplierPayments.filter(x => x.id !== id) }));
        get().addLog('Payment Deleted', `${p?.supplier || 'Unknown'}`);
      },

      // === CUSTOMER PAYMENTS ===
      addCustomerPayment: (data) => {
        updateUser(set, get, (tenantData) => ({ customerPayments: [...tenantData.customerPayments, { id: generateId(), ...data }] }));
        get().addLog('Customer Payment Added', `${data.customer}: ${data.amount}`);
      },
      editCustomerPayment: (id, data) => {
        updateUser(set, get, (tenantData) => ({ customerPayments: tenantData.customerPayments.map(p => p.id === id ? { ...p, ...data } : p) }));
        get().addLog('Customer Payment Edited', `${data.customer}: ${data.amount}`);
      },
      deleteCustomerPayment: (id) => {
        const p = get().getCustomerPayments().find(x => x.id === id);
        updateUser(set, get, (tenantData) => ({ customerPayments: tenantData.customerPayments.filter(x => x.id !== id) }));
        get().addLog('Customer Payment Deleted', `${p?.customer || 'Unknown'}`);
      },

      // === BREAKFAST ===
      saveBreakfastMenu: (day, menu) => {
        updateUser(set, get, (data) => ({ breakfastMenus: { ...data.breakfastMenus, [day]: menu } }));
        get().addLog('Breakfast Menu Saved', day);
      },

      logBreakfast: (roomNumber, guestCount, debtor) => {
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = getDayOfWeek(today);
        const logId = generateId();
        
        updateUser(set, get, (data) => {
          const menu = data.breakfastMenus[dayOfWeek];
          const totalRevenue = menu ? menu.pricePerGuest * guestCount : 0;

          // Create direct consumptions
          const newConsumptions: DirectConsumption[] = [];
          if (menu && menu.ingredients.length > 0) {
            menu.ingredients.forEach(ing => {
              const gross = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
              newConsumptions.push({
                id: generateId(),
                date: today,
                productId: ing.productId,
                quantity: gross * guestCount,
                source: 'breakfast',
                reference: logId,
                department: 'breakfast',
              });
            });
          }

          const newLog: BreakfastLog = { id: logId, date: today, roomNumber, guestCount, dayOfWeek, debtor, totalRevenue };
          return {
            breakfastLogs: [...data.breakfastLogs, newLog],
            directConsumptions: [...data.directConsumptions, ...newConsumptions],
          };
        });
        get().addLog('Breakfast Served', `Room ${roomNumber}, ${guestCount} guests (${dayOfWeek})${debtor ? ` to ${debtor}` : ''}`);
      },

      deleteBreakfastLog: (id) => {
        updateUser(set, get, (data) => ({
          breakfastLogs: data.breakfastLogs.filter(l => l.id !== id),
          directConsumptions: data.directConsumptions.filter(dc => dc.reference !== id),
        }));
        get().addLog('Breakfast Log Deleted', id);
      },

      // === HOUSEKEEPING ===
      saveHousekeepingBOM: (items) => {
        updateUser(set, get, () => ({ housekeepingBOM: items }));
        get().addLog('Housekeeping BOM Saved', `${items.length} items`);
      },

      addRoom: (roomData) => {
        updateUser(set, get, (data) => ({ rooms: [...data.rooms, { id: generateId(), ...roomData }] }));
        get().addLog('Room Added', `Room ${roomData.number}`);
      },

      deleteRoom: (id) => {
        const room = get().getRooms().find(r => r.id === id);
        updateUser(set, get, (data) => ({ rooms: data.rooms.filter(r => r.id !== id) }));
        get().addLog('Room Deleted', `Room ${room?.number || id}`);
      },

      updateRoomStatus: (id, status, guestCount) => {
        const state = get();
        const room = state.getRooms().find(r => r.id === id);
        if (!room) return;

        const updatedRoom = { ...room, status, guestCount: guestCount !== undefined ? guestCount : room.guestCount };

        updateUser(set, get, (data) => {
          // When marking as 'clean', consume housekeeping materials
          const newConsumptions: DirectConsumption[] = [];
          let logId = '';
          if (status === 'clean' && updatedRoom.guestCount > 0 && data.housekeepingBOM.length > 0) {
            logId = generateId();
            data.housekeepingBOM.forEach(item => {
              newConsumptions.push({
                id: generateId(),
                date: new Date().toISOString().split('T')[0],
                productId: item.productId,
                quantity: item.quantity * updatedRoom.guestCount,
                source: 'housekeeping',
                reference: logId,
                department: 'housekeeping',
              });
            });
          }

          const newHKLog: HousekeepingLog | null = status === 'clean' && updatedRoom.guestCount > 0 ? {
            id: logId || generateId(),
            date: new Date().toISOString().split('T')[0],
            roomId: id,
            roomNumber: room.number,
            guestCount: updatedRoom.guestCount,
          } : null;

          return {
            rooms: data.rooms.map(r => r.id === id ? (status === 'clean' ? { ...updatedRoom, guestCount: 0 } : updatedRoom) : r),
            directConsumptions: [...data.directConsumptions, ...newConsumptions],
            housekeepingLogs: newHKLog ? [...data.housekeepingLogs, newHKLog] : data.housekeepingLogs,
          };
        });

        get().addLog('Room Status', `Room ${room.number} → ${status}${guestCount ? ` (${guestCount} guests)` : ''}`);
      },

      deleteHousekeepingLog: (id) => {
        updateUser(set, get, (data) => ({
          housekeepingLogs: data.housekeepingLogs.filter(l => l.id !== id),
          directConsumptions: data.directConsumptions.filter(dc => dc.reference !== id),
        }));
        get().addLog('HK Log Deleted', id);
      },

      // === SYSTEM ===
      clearAllData: () => {
        updateUser(set, get, () => createEmptyTenantData());
        get().addLog('System Wipe', 'All system data was completely wiped');
      },

      restoreData: (parsedData: any) => {
        updateUser(set, get, (state: any) => ({
          products: parsedData.products || state.products,
          purchases: parsedData.purchases || state.purchases,
          sales: parsedData.sales || state.sales,
          dishes: parsedData.dishes || state.dishes,
          inventoryAudits: parsedData.inventoryAudits || state.inventoryAudits,
          activityLogs: parsedData.activityLogs || state.activityLogs,
          supplierPayments: parsedData.supplierPayments || state.supplierPayments,
          customerPayments: parsedData.customerPayments || state.customerPayments,
          breakfastMenus: parsedData.breakfastMenus || state.breakfastMenus,
          breakfastLogs: parsedData.breakfastLogs || state.breakfastLogs,
          housekeepingBOM: parsedData.housekeepingBOM || state.housekeepingBOM,
          rooms: parsedData.rooms || state.rooms,
          housekeepingLogs: parsedData.housekeepingLogs || state.housekeepingLogs,
          directConsumptions: parsedData.directConsumptions || state.directConsumptions,
        }));
        get().addLog('System Restore', 'Database restored successfully from backup file');
      },

      executeChefsGrandOpeningTest: () => {
        const today = new Date().toISOString().split('T')[0];
        
        const meats = ['Ribeye','Tenderloin','Lamb Chops','Pork Belly','Chicken Breast','Duck Breast','Veal Chop','Wagyu Beef','Quail','Venison'];
        const fish = ['Sea Bass','Salmon','Tuna','Shrimp','Scallops','Octopus','Squid','Lobster','Crab','Caviar'];
        const veg = ['Tomato','Cucumber','Onion','Mushroom','Eggplant','Zucchini','Red Bell Pepper','Green Bell Pepper','Potato','Carrot','Broccoli','Cauliflower','Asparagus','Spinach','Garlic','Cherry Tomato','Artichoke','Sweet Potato','Leek','Celery'];
        const herbs = ['Basil','Parsley','Tarragon','Mint','Coriander','Dill','Rosemary','Thyme','Oregano','Lemongrass'];
        const cheese = ['Sulguni','Imeretian','Gouda','Parmesan','Roquefort','Cheddar','Mozzarella','Camembert','Brie','Feta'];
        const spices = ['Saffron','Black Pepper','Salt','Paprika','Cumin','Turmeric','Cinnamon','Nutmeg','Cardamom','Chili Powder'];
        const dry = ['Truffle Oil','Olive Oil','Butter','Cream 18%','Milk','Eggs','Flour','Sugar','Rice','Pasta','Honey','Balsamic Vinegar','Soy Sauce','Walnuts','Almonds','Pine Nuts','Lemon','Orange','Apple','Truffles','Coffee Beans','Vanilla Extract','Mustard','White Wine','Red Wine','Chicken Stock','Beef Stock','Fish Stock','Yeast','Baking Powder'];
        const suppliers = ['GeoFresh Ltd','Tbilisi Market','Black Sea Foods','Kakheti Farms','EuroImport'];

        const rawItems = [
          ...meats.map(n => ({ n, c: 'Meat/Fish', p: Math.floor(Math.random()*20)+25 })),
          ...fish.map(n => ({ n, c: 'Meat/Fish', p: Math.floor(Math.random()*20)+25 })),
          ...veg.map(n => ({ n, c: 'Produce', p: Math.floor(Math.random()*8)+3 })),
          ...herbs.map(n => ({ n, c: 'Produce', p: Math.floor(Math.random()*10)+5 })),
          ...cheese.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random()*15)+15 })),
          ...spices.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random()*45)+5 })),
          ...dry.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random()*20)+5 }))
        ];

        const gP: Product[] = []; const gPu: Purchase[] = [];
        rawItems.forEach((item, idx) => {
          const pId = `PROD-CHEF-${idx}`;
          const u = (item.n==='Eggs'||item.n==='Caviar'||item.n==='Saffron')?'pack':(item.n.includes('Oil')||item.n.includes('Wine')||item.n.includes('Stock')||item.n==='Milk')?'liter':'kg';
          gP.push({ id: pId, code: `C${1000+idx}`, name: item.n, unit: u, category: item.c, minBalance: 5 });
          gPu.push({ id: `PUR-CHEF-${idx}`, date: today, productId: pId, quantity: 100, price: item.p, total: 100*item.p, supplier: suppliers[idx%suppliers.length] });
        });

        const adj = ["Truffle-infused","Pan-seared","Roasted","Confit","Grilled","Braised","Smoked","Poached","Caramelized","Spicy"];
        const nouns = ["Medley","Delight","Fusion","Symphony","Trio","Essence","Plate","Bowl","Experience","Creation"];
        const gD: Dish[] = [];
        for(let i=0;i<30;i++){
          const n=Math.floor(Math.random()*5)+4;
          const sp=[...gP].sort(()=>0.5-Math.random()).slice(0,n);
          const ings: Ingredient[]=sp.map(s=>({productId:s.id,quantity:Number((Math.random()*0.2+0.05).toFixed(3)),lossPercentage:s.category==='Meat/Fish'?25:s.category==='Produce'?Math.floor(Math.random()*6)+15:5}));
          gD.push({id:`DISH-CHEF-${i}`,name:`${adj[Math.floor(Math.random()*adj.length)]} ${sp[0].name} ${nouns[Math.floor(Math.random()*nouns.length)]}`,category:'Chef Signature',salePrice:Math.floor(Math.random()*66)+15,ingredients:ings});
        }

        const gS: Sale[] = [];
        const sd=[...gD].sort(()=>0.5-Math.random()).slice(0,15);
        sd.forEach((dish,idx)=>{gS.push({id:`SALE-CHEF-${idx}`,date:today,dishId:dish.id,quantity:20,totalRevenue:20*dish.salePrice});});

        updateUser(set, get, () => ({
          products: gP, purchases: gPu, dishes: gD, sales: gS, inventoryAudits: [], supplierPayments: [], customerPayments: []
        }));
        get().addLog('System Test', 'Chef Grand Opening data generated successfully');
      },
    }),
    {
      name: 'cost-control-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);