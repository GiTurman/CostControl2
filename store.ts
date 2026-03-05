import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Product, Purchase, Sale, Dish, Language, InventoryAudit, Ingredient, ActivityLog,
  SupplierPayment, CustomerPayment, BreakfastDayMenu, DayOfWeek, WeeklyBreakfastMenus, BreakfastLog,
  HousekeepingBOMItem, Room, RoomStatus, HousekeepingLog, DirectConsumption, BreakfastIngredient, Department
} from './types';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyDayMenu = (): BreakfastDayMenu => ({ ingredients: [], pricePerGuest: 0 });

const defaultWeeklyMenus = (): WeeklyBreakfastMenus => ({
  monday: emptyDayMenu(), tuesday: emptyDayMenu(), wednesday: emptyDayMenu(),
  thursday: emptyDayMenu(), friday: emptyDayMenu(), saturday: emptyDayMenu(), sunday: emptyDayMenu(),
});

interface AppState {
  language: Language;
  username: string;
  password: string;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  dishes: Dish[];
  inventoryAudits: InventoryAudit[];
  activityLogs: ActivityLog[];
  supplierPayments: SupplierPayment[];
  customerPayments: CustomerPayment[];
  // Breakfast
  breakfastMenus: WeeklyBreakfastMenus;
  breakfastLogs: BreakfastLog[];
  // Housekeeping
  housekeepingBOM: HousekeepingBOMItem[];
  rooms: Room[];
  housekeepingLogs: HousekeepingLog[];
  // Direct consumption (inventory link)
  directConsumptions: DirectConsumption[];

  // Auth & settings
  setLanguage: (lang: Language) => void;
  login: (inputPassword: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  updatePassword: (current: string, newPass: string) => boolean;
  addLog: (action: string, details: string) => void;
  clearLogs: () => void;
  // Products
  updateProductMinBalance: (id: string, minBalance: number) => void;
  addProduct: (product: Product) => void;
  // Dishes
  addDish: (dish: Dish) => void;
  editDish: (id: string, dish: Dish) => void;
  deleteDish: (id: string) => void;
  // Purchases
  addPurchase: (purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }) => void;
  editPurchase: (id: string, purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }) => void;
  bulkAddPurchases: (purchases: Array<Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string; unit: string; category: string; code?: string; supplier?: string; department?: Department }>) => void;
  deletePurchase: (id: string) => void;
  // Sales
  addSale: (sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  editSale: (id: string, sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  deleteSale: (id: string) => void;
  // Inventory
  saveInventoryAudit: (audit: Omit<InventoryAudit, 'id'>) => void;
  // Supplier payments
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => void;
  editSupplierPayment: (id: string, payment: Omit<SupplierPayment, 'id'>) => void;
  deleteSupplierPayment: (id: string) => void;
  // Customer payments
  addCustomerPayment: (payment: Omit<CustomerPayment, 'id'>) => void;
  editCustomerPayment: (id: string, payment: Omit<CustomerPayment, 'id'>) => void;
  deleteCustomerPayment: (id: string) => void;
  // Breakfast
  saveBreakfastMenu: (day: DayOfWeek, menu: BreakfastDayMenu) => void;
  logBreakfast: (roomNumber: string, guestCount: number, debtor?: string) => void;
  deleteBreakfastLog: (id: string) => void;
  // Housekeeping
  saveHousekeepingBOM: (items: HousekeepingBOMItem[]) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  deleteRoom: (id: string) => void;
  updateRoomStatus: (id: string, status: RoomStatus, guestCount?: number) => void;
  deleteHousekeepingLog: (id: string) => void;
  // System
  clearAllData: () => void;
  restoreData: (data: Partial<AppState>) => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'ka',
      username: 'Administrator',
      password: '111979',
      isAuthenticated: false,
      isFirstLogin: true,
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

      setLanguage: (lang) => set({ language: lang }),

      login: (inputPassword) => {
        const state = get();
        if (state.password === inputPassword) {
          set({ isAuthenticated: true });
          get().addLog('User Login', 'Successful authentication');
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
        get().addLog('User Logout', 'User ended session');
      },

      changePassword: (newPassword) => {
        set({ password: newPassword, isFirstLogin: false });
        get().addLog('Password Changed', 'User updated initial password');
      },

      updatePassword: (current, newPass) => {
        const state = get();
        if (state.password === current) {
          set({ password: newPass, isFirstLogin: false });
          get().addLog('Password Changed', 'User manually updated password');
          return true;
        }
        return false;
      },

      addLog: (action, details) => set((state) => ({
        activityLogs: [
          { id: generateId(), timestamp: new Date().toISOString(), action, details, user: state.username },
          ...state.activityLogs
        ]
      })),

      clearLogs: () => set({ activityLogs: [] }),

      updateProductMinBalance: (id, minBalance) => {
        const product = get().products.find(p => p.id === id);
        set((state) => ({ products: state.products.map(p => p.id === id ? { ...p, minBalance } : p) }));
        get().addLog('Min Balance Updated', `${product?.name || id} set to ${minBalance}`);
      },

      addProduct: (product) => {
        set((state) => ({ products: [...state.products, product] }));
        get().addLog('Product Created', `${product.name} (${product.unit})`);
      },

      addDish: (dish) => {
        set((state) => ({ dishes: [...state.dishes, dish] }));
        get().addLog('Dish Created', dish.name);
      },

      editDish: (id, dish) => {
        set((state) => ({ dishes: state.dishes.map(d => d.id === id ? dish : d) }));
        get().addLog('Dish Edited', dish.name);
      },

      deleteDish: (id) => {
        const dish = get().dishes.find(d => d.id === id);
        set((state) => ({ dishes: state.dishes.filter(d => d.id !== id) }));
        get().addLog('Dish Deleted', dish?.name || id);
      },

      deletePurchase: (id) => {
        const purchase = get().purchases.find(p => p.id === id);
        const product = get().products.find(p => p.id === purchase?.productId);
        set((state) => ({ purchases: state.purchases.filter(p => p.id !== id) }));
        get().addLog('Purchase Deleted', `${product?.name || 'Unknown'} x${purchase?.quantity || 0}`);
      },

      addSale: (saleData) => {
        const dish = get().dishes.find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;
        set((state) => ({ sales: [...state.sales, { id: generateId(), ...saleData, totalRevenue }] }));
        get().addLog('Sale Added', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      editSale: (id, saleData) => {
        const dish = get().dishes.find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;
        set((state) => ({ sales: state.sales.map(s => s.id === id ? { ...s, ...saleData, totalRevenue } : s) }));
        get().addLog('Sale Edited', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      deleteSale: (id) => {
        const sale = get().sales.find(s => s.id === id);
        const dish = get().dishes.find(d => d.id === sale?.dishId);
        set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
        get().addLog('Sale Deleted', `${dish?.name || 'Unknown'} x${sale?.quantity || 0}`);
      },

      addPurchase: (purchaseData) => {
        const state = get();
        let existingProduct = state.products.find(p => p.name.toLowerCase() === purchaseData.productName.toLowerCase());
        let newProducts = [...state.products];
        let productId = existingProduct?.id;
        if (!existingProduct) {
          productId = generateId();
          newProducts.push({ id: productId, code: purchaseData.code, name: purchaseData.productName, unit: purchaseData.unit, category: purchaseData.category, minBalance: 0 });
        } else if (purchaseData.code && !existingProduct.code) {
          existingProduct.code = purchaseData.code;
        }
        set({
          products: newProducts,
          purchases: [...state.purchases, { id: generateId(), date: purchaseData.date, productId: productId!, quantity: purchaseData.quantity, price: purchaseData.price, total: purchaseData.quantity * purchaseData.price, supplier: purchaseData.supplier || '' }],
        });
        get().addLog('Purchase Added', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      editPurchase: (id, purchaseData) => {
        const state = get();
        let existingProduct = state.products.find(p => p.name.toLowerCase() === purchaseData.productName.toLowerCase());
        let newProducts = [...state.products];
        let productId = existingProduct?.id;
        if (!existingProduct) {
          productId = generateId();
          newProducts.push({ id: productId, code: purchaseData.code, name: purchaseData.productName, unit: purchaseData.unit, category: purchaseData.category, minBalance: 0 });
        } else if (purchaseData.code && !existingProduct.code) {
          existingProduct.code = purchaseData.code;
        }
        set({
          products: newProducts,
          purchases: state.purchases.map(p => p.id === id ? { ...p, date: purchaseData.date, productId: productId!, quantity: purchaseData.quantity, price: purchaseData.price, total: purchaseData.quantity * purchaseData.price, supplier: purchaseData.supplier || '' } : p),
        });
        get().addLog('Purchase Edited', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      bulkAddPurchases: (bulkPurchases) => {
        const state = get();
        let newProducts = [...state.products];
        let newPurchases = [...state.purchases];
        bulkPurchases.forEach(pd => {
          let ep = newProducts.find(p => p.name.toLowerCase() === pd.productName.toLowerCase());
          let pid = ep?.id;
          if (!ep) {
            pid = generateId();
            newProducts.push({ id: pid, code: pd.code, name: pd.productName, unit: pd.unit, category: pd.category || 'General', minBalance: 0 });
          } else if (pd.code && !ep.code) { ep.code = pd.code; }
          newPurchases.push({ id: generateId(), date: pd.date, productId: pid!, quantity: pd.quantity, price: pd.price, total: pd.quantity * pd.price, supplier: pd.supplier || '' });
        });
        set({ products: newProducts, purchases: newPurchases });
        get().addLog('Bulk Import', `${bulkPurchases.length} purchases imported from Excel`);
      },

      saveInventoryAudit: (audit) => {
        const state = get();
        const idx = state.inventoryAudits.findIndex(a => a.date === audit.date);
        const newAudits = [...state.inventoryAudits];
        if (idx >= 0) { newAudits[idx] = { ...newAudits[idx], balances: audit.balances }; }
        else { newAudits.push({ id: generateId(), ...audit }); }
        set({ inventoryAudits: newAudits });
        get().addLog('Inventory Saved', `Audit for date ${audit.date}`);
      },

      // === SUPPLIER PAYMENTS ===
      addSupplierPayment: (data) => {
        set((state) => ({ supplierPayments: [...state.supplierPayments, { id: generateId(), ...data }] }));
        get().addLog('Payment Added', `${data.supplier}: ${data.amount}`);
      },
      editSupplierPayment: (id, data) => {
        set((state) => ({ supplierPayments: state.supplierPayments.map(p => p.id === id ? { ...p, ...data } : p) }));
        get().addLog('Payment Edited', `${data.supplier}: ${data.amount}`);
      },
      deleteSupplierPayment: (id) => {
        const p = get().supplierPayments.find(x => x.id === id);
        set((state) => ({ supplierPayments: state.supplierPayments.filter(x => x.id !== id) }));
        get().addLog('Payment Deleted', `${p?.supplier || 'Unknown'}`);
      },

      // === CUSTOMER PAYMENTS ===
      addCustomerPayment: (data) => {
        set((state) => ({ customerPayments: [...state.customerPayments, { id: generateId(), ...data }] }));
        get().addLog('Customer Payment Added', `${data.customer}: ${data.amount}`);
      },
      editCustomerPayment: (id, data) => {
        set((state) => ({ customerPayments: state.customerPayments.map(p => p.id === id ? { ...p, ...data } : p) }));
        get().addLog('Customer Payment Edited', `${data.customer}: ${data.amount}`);
      },
      deleteCustomerPayment: (id) => {
        const p = get().customerPayments.find(x => x.id === id);
        set((state) => ({ customerPayments: state.customerPayments.filter(x => x.id !== id) }));
        get().addLog('Customer Payment Deleted', `${p?.customer || 'Unknown'}`);
      },

      // === BREAKFAST ===
      saveBreakfastMenu: (day, menu) => {
        set((state) => ({ breakfastMenus: { ...state.breakfastMenus, [day]: menu } }));
        get().addLog('Breakfast Menu Saved', day);
      },

      logBreakfast: (roomNumber, guestCount, debtor) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = getDayOfWeek(today);
        const menu = state.breakfastMenus[dayOfWeek];
        const logId = generateId();
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
            });
          });
        }

        const newLog: BreakfastLog = { id: logId, date: today, roomNumber, guestCount, dayOfWeek, debtor, totalRevenue };

        set((state) => ({
          breakfastLogs: [...state.breakfastLogs, newLog],
          directConsumptions: [...state.directConsumptions, ...newConsumptions],
        }));
        get().addLog('Breakfast Served', `Room ${roomNumber}, ${guestCount} guests (${dayOfWeek})${debtor ? ` to ${debtor}` : ''}`);
      },

      deleteBreakfastLog: (id) => {
        set((state) => ({
          breakfastLogs: state.breakfastLogs.filter(l => l.id !== id),
          directConsumptions: state.directConsumptions.filter(dc => dc.reference !== id),
        }));
        get().addLog('Breakfast Log Deleted', id);
      },

      // === HOUSEKEEPING ===
      saveHousekeepingBOM: (items) => {
        set({ housekeepingBOM: items });
        get().addLog('Housekeeping BOM Saved', `${items.length} items`);
      },

      addRoom: (roomData) => {
        set((state) => ({ rooms: [...state.rooms, { id: generateId(), ...roomData }] }));
        get().addLog('Room Added', `Room ${roomData.number}`);
      },

      deleteRoom: (id) => {
        const room = get().rooms.find(r => r.id === id);
        set((state) => ({ rooms: state.rooms.filter(r => r.id !== id) }));
        get().addLog('Room Deleted', `Room ${room?.number || id}`);
      },

      updateRoomStatus: (id, status, guestCount) => {
        const state = get();
        const room = state.rooms.find(r => r.id === id);
        if (!room) return;

        const updatedRoom = { ...room, status, guestCount: guestCount !== undefined ? guestCount : room.guestCount };

        // When marking as 'clean', consume housekeeping materials
        const newConsumptions: DirectConsumption[] = [];
        let logId = '';
        if (status === 'clean' && updatedRoom.guestCount > 0 && state.housekeepingBOM.length > 0) {
          logId = generateId();
          state.housekeepingBOM.forEach(item => {
            newConsumptions.push({
              id: generateId(),
              date: new Date().toISOString().split('T')[0],
              productId: item.productId,
              quantity: item.quantity * updatedRoom.guestCount,
              source: 'housekeeping',
              reference: logId,
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

        set((state) => ({
          rooms: state.rooms.map(r => r.id === id ? updatedRoom : r),
          directConsumptions: [...state.directConsumptions, ...newConsumptions],
          housekeepingLogs: newHKLog ? [...state.housekeepingLogs, newHKLog] : state.housekeepingLogs,
        }));

        // Reset guest count after cleaning
        if (status === 'clean') {
          set((state) => ({ rooms: state.rooms.map(r => r.id === id ? { ...r, guestCount: 0 } : r) }));
        }

        get().addLog('Room Status', `Room ${room.number} → ${status}${guestCount ? ` (${guestCount} guests)` : ''}`);
      },

      deleteHousekeepingLog: (id) => {
        set((state) => ({
          housekeepingLogs: state.housekeepingLogs.filter(l => l.id !== id),
          directConsumptions: state.directConsumptions.filter(dc => dc.reference !== id),
        }));
        get().addLog('HK Log Deleted', id);
      },

      // === SYSTEM ===
      clearAllData: () => {
        set({
          products: [], purchases: [], sales: [], dishes: [],
          inventoryAudits: [], activityLogs: [], supplierPayments: [], customerPayments: [],
          breakfastMenus: defaultWeeklyMenus(), breakfastLogs: [],
          housekeepingBOM: [], rooms: [], housekeepingLogs: [], directConsumptions: [],
        });
        get().addLog('System Wipe', 'All system data was completely wiped');
      },

      restoreData: (parsedData: any) => {
        set((state: any) => ({
          ...state,
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
        set({ products: [], purchases: [], sales: [], dishes: [], inventoryAudits: [], activityLogs: [], supplierPayments: [], breakfastLogs: [], housekeepingLogs: [], directConsumptions: [] });

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

        set({ products: gP, purchases: gPu, dishes: gD, sales: gS, inventoryAudits: [], supplierPayments: [], customerPayments: [] });
        get().addLog('System Test', 'Chef Grand Opening data generated successfully');
      },
    }),
    {
      name: 'cost-control-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);