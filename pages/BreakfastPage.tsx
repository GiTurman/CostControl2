import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { DayOfWeek, BreakfastIngredient, BreakfastLog } from '../types';
import { 
  Coffee, Plus, Trash2, Save, CheckCircle, UtensilsCrossed, 
  ChevronDown, ChevronRight, Receipt, Calculator, Percent, Scale, Trash 
} from 'lucide-react';

const DAYS: { key: DayOfWeek; ka: string; en: string }[] = [
  { key: 'monday', ka: 'ორშაბათი', en: 'Monday' },
  { key: 'tuesday', ka: 'სამშაბათი', en: 'Tuesday' },
  { key: 'wednesday', ka: 'ოთხშაბათი', en: 'Wednesday' },
  { key: 'thursday', ka: 'ხუთშაბათი', en: 'Thursday' },
  { key: 'friday', ka: 'პარასკევი', en: 'Friday' },
  { key: 'saturday', ka: 'შაბათი', en: 'Saturday' },
  { key: 'sunday', ka: 'კვირა', en: 'Sunday' },
];

export const BreakfastPage: React.FC = () => {
  const { 
    language, getProducts, getPurchases, getBreakfastMenus, saveBreakfastMenu, 
    getBreakfastLogs, logBreakfast, deleteBreakfastLog, getRooms 
  } = useAppStore();
  const products = getProducts();
  const purchases = getPurchases();
  const breakfastMenus = getBreakfastMenus();
  const breakfastLogs = getBreakfastLogs();
  const rooms = getRooms();

  const deptProducts = useMemo(() => products.filter(p => (p.department || 'restaurant') === 'breakfast'), [products]);
  const deptPurchases = useMemo(() => purchases.filter(p => (p.department || 'restaurant') === 'breakfast'), [purchases]);

  const [activeTab, setActiveTab] = useState<'pos' | 'menu'>('pos');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // --- MENU CONSTRUCTOR STATE (From MenuPage logic) ---
  const [editIngredients, setEditIngredients] = useState<BreakfastIngredient[]>([]);
  const [editPrice, setEditPrice] = useState<string>('0');

  useEffect(() => {
    const menu = breakfastMenus[selectedDay];
    setEditIngredients(menu?.ingredients || []);
    setEditPrice(String(menu?.pricePerGuest || 0));
  }, [selectedDay, breakfastMenus]);

  // --- POS STATE (From SalesPage logic) ---
  const [checkinRoom, setCheckinRoom] = useState('');
  const [checkinGuests, setCheckinGuests] = useState('');
  const [checkinDebtor, setCheckinDebtor] = useState('');

  // --- HELPER FUNCTIONS (From MenuPage) ---
  const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
    const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
    return netQuantity / (1 - (validLoss / 100));
  };

  const getProductLastPrice = (productId: string): number => {
    const prodPurchases = deptPurchases.filter(p => p.productId === productId);
    if (prodPurchases.length === 0) return 0;
    return [...prodPurchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].price;
  };

  const currentCostPrice = useMemo(() => {
    return editIngredients.reduce((total, ing) => {
      const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
      return total + (getProductLastPrice(ing.productId) * grossQty);
    }, 0);
  }, [editIngredients, deptPurchases]);

  // --- HANDLERS ---
  const handleSaveMenu = () => {
    const validIngredients = editIngredients.filter(i => i.productId && i.quantity > 0);
    saveBreakfastMenu(selectedDay, { ingredients: validIngredients, pricePerGuest: Number(editPrice) || 0 });
    setAlertMessage(language === 'ka' ? 'მენიუ შენახულია!' : 'Menu saved!');
  };

  const handleProcessBreakfast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinRoom || !checkinGuests) return;
    logBreakfast(checkinRoom, Number(checkinGuests), checkinDebtor.trim() || undefined);
    setCheckinRoom('');
    setCheckinGuests('');
    setCheckinDebtor('');
  };

  const groupedLogs = useMemo(() => {
    const groups: Record<string, BreakfastLog[]> = {};
    [...breakfastLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(l => {
        if (!groups[l.date]) groups[l.date] = [];
        groups[l.date].push(l);
      });
    return groups;
  }, [breakfastLogs]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex bg-white p-4 rounded-2xl shadow-sm border border-gray-200 justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl"><Coffee className="w-6 h-6 text-amber-600" /></div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{language === 'ka' ? 'საუზმე' : 'Breakfast'}</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button onClick={() => setActiveTab('pos')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            POS / რეესტრი
          </button>
          <button onClick={() => setActiveTab('menu')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            მენიუს კონსტრუქტორი
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Check-in Form (SalesPage style) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" /> {language === 'ka' ? 'საუზმის გატარება' : 'Log Breakfast'}
              </h3>
              <form onSubmit={handleProcessBreakfast} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'ოთახი' : 'Room'}</label>
                  <select required value={checkinRoom} onChange={e => setCheckinRoom(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm">
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {rooms.map(r => <option key={r.id} value={r.number}>Room {r.number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'სტუმრები' : 'Guests'}</label>
                  <input type="number" min="1" required value={checkinGuests} onChange={e => setCheckinGuests(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'კომპანია / დებიტორი (არასავალდებულო)' : 'Company / Debtor (Optional)'}</label>
                  <input type="text" value={checkinDebtor} onChange={e => setCheckinDebtor(e.target.value)} placeholder={language === 'ka' ? 'მაგ. Booking.com' : 'e.g. Booking.com'} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                   <span className="text-sm font-medium text-amber-800">{language === 'ka' ? 'ჯამური შემოსავალი' : 'Revenue'}:</span>
                   <span className="text-xl font-bold text-amber-900">{formatCurrency((Number(checkinGuests) || 0) * (breakfastMenus[selectedDay]?.pricePerGuest || 0))}</span>
                </div>
                <button type="submit" className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all active:scale-95 shadow-md">
                  {language === 'ka' ? 'დასტური / გატარება' : 'Confirm & Process'}
                </button>
              </form>
            </div>
          </div>

          {/* Archive (SalesPage style) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-gray-900">{language === 'ka' ? 'საუზმის არქივი' : 'Breakfast Archive'}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(groupedLogs).map(([date, logs]: [string, BreakfastLog[]]) => (
                  <div key={date} className="group">
                    <button onClick={() => setExpandedDates(p => ({...p, [date]: !p[date]}))} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedDates[date] === false ? <ChevronRight size={18}/> : <ChevronDown size={18}/>}
                        <span className="font-bold text-gray-800">{date}</span>
                        <span className="text-xs font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">{logs.length} items</span>
                      </div>
                    </button>
                    {expandedDates[date] !== false && (
                      <div className="px-5 pb-5">
                        <table className="min-w-full divide-y divide-gray-200 border rounded-xl overflow-hidden shadow-sm">
                          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                            <tr>
                              <th className="px-4 py-3 text-left">{language === 'ka' ? 'ოთახი' : 'Room'}</th>
                              <th className="px-4 py-3 text-left">{language === 'ka' ? 'დებიტორი' : 'Debtor'}</th>
                              <th className="px-4 py-3 text-right">{language === 'ka' ? 'სტუმრები' : 'Guests'}</th>
                              <th className="px-4 py-3 text-right">{language === 'ka' ? 'დღე' : 'Day'}</th>
                              <th className="px-4 py-3 text-right w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100 text-sm">
                            {logs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-gray-900">Room {log.roomNumber}</td>
                                <td className="px-4 py-3 text-gray-600">{log.debtor || '-'}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{log.guestCount}</td>
                                <td className="px-4 py-3 text-right text-gray-400 text-xs uppercase">{log.dayOfWeek}</td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => deleteBreakfastLog(log.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MENU CONSTRUCTOR (MenuPage style) */
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button key={day.key} onClick={() => setSelectedDay(day.key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedDay === day.key ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>
                {language === 'ka' ? day.ka : day.en}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Ingredients Table (MenuPage dense style) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Scale size={16}/> {language === 'ka' ? 'რეცეპტურა' : 'Standard BOM'}</h3>
                <button onClick={() => setEditIngredients([...editIngredients, { productId: '', quantity: 0, lossPercentage: 0 }])} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-700 flex items-center gap-1.5">
                  <Plus size={14}/> {t(language, 'addIngredient')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase text-[10px]">{t(language, 'productName')}</th>
                      <th className="px-4 py-2 text-right font-bold text-gray-500 uppercase text-[10px]">{t(language, 'netWeight')}</th>
                      <th className="px-4 py-2 text-right font-bold text-gray-500 uppercase text-[10px]">{t(language, 'lossPercentage')}</th>
                      <th className="px-4 py-2 text-right font-bold text-gray-500 uppercase text-[10px]">ბრუტო</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {editIngredients.map((ing, idx) => {
                      const prod = deptProducts.find(p => p.id === ing.productId);
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <select value={ing.productId} onChange={e => {
                              const news = [...editIngredients]; news[idx].productId = e.target.value; setEditIngredients(news);
                            }} className="w-full bg-transparent border-none font-medium focus:ring-0 text-gray-900 p-0">
                              <option value="">{t(language, 'selectIngredient')}</option>
                              {deptProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" step="0.001" value={ing.quantity || ''} onChange={e => {
                              const news = [...editIngredients]; news[idx].quantity = Number(e.target.value); setEditIngredients(news);
                            }} className="w-20 text-right bg-transparent border-none p-0 focus:ring-0 font-mono font-bold" placeholder="0.000" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input type="number" value={ing.lossPercentage || ''} onChange={e => {
                                const news = [...editIngredients]; news[idx].lossPercentage = Number(e.target.value); setEditIngredients(news);
                              }} className="w-12 text-right bg-transparent border-none p-0 focus:ring-0 text-amber-600 font-bold" placeholder="0" />
                              <span className="text-[10px] text-gray-400 font-bold">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-400 font-mono text-xs">
                            {getGrossQuantity(ing.quantity, ing.lossPercentage).toFixed(3)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => setEditIngredients(editIngredients.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary (MenuPage style footer) */}
            <div className="lg:col-span-4">
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Calculator className="text-amber-400" size={20}/>
                  <h4 className="font-bold text-sm uppercase tracking-wider">{language === 'ka' ? 'ფინანსური გათვლა' : 'Financials'}</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t(language, 'costPrice')} (Food Cost)</span>
                    <div className="text-2xl font-bold text-white mt-1">{formatCurrency(currentCostPrice)}</div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1.5">{t(language, 'salePrice')} (₾)</label>
                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 px-4 text-xl font-bold text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" />
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400 font-bold uppercase">{t(language, 'profit')}</span>
                      <span className={`font-bold ${Number(editPrice) - currentCostPrice >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(Number(editPrice) - currentCostPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold uppercase">Margin</span>
                      <span className="text-lg font-bold text-white">
                        {Number(editPrice) > 0 ? (((Number(editPrice) - currentCostPrice) / Number(editPrice)) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveMenu} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Save size={16}/> {t(language, 'save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={24}/>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};