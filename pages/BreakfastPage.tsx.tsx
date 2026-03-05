import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { DayOfWeek, BreakfastIngredient } from '../types';
import { Coffee, Plus, Trash2, Save, CheckCircle, UtensilsCrossed, Calendar } from 'lucide-react';

const DAYS: { key: DayOfWeek; ka: string; en: string }[] = [
  { key: 'monday', ka: 'ორშაბათი', en: 'Monday' },
  { key: 'tuesday', ka: 'სამშაბათი', en: 'Tuesday' },
  { key: 'wednesday', ka: 'ოთხშაბათი', en: 'Wednesday' },
  { key: 'thursday', ka: 'ხუთშაბათი', en: 'Thursday' },
  { key: 'friday', ka: 'პარასკევი', en: 'Friday' },
  { key: 'saturday', ka: 'შაბათი', en: 'Saturday' },
  { key: 'sunday', ka: 'კვირა', en: 'Sunday' },
];

const getTodayDayKey = (): DayOfWeek => {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1].key;
};

export const BreakfastPage: React.FC = () => {
  const { language, products, breakfastMenus, saveBreakfastMenu, breakfastLogs, logBreakfast, deleteBreakfastLog, rooms } = useAppStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'checkin'>('checkin');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayKey());
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Menu editor state
  const currentMenu = breakfastMenus[selectedDay];
  const [editIngredients, setEditIngredients] = useState<BreakfastIngredient[]>(currentMenu?.ingredients || []);
  const [editPrice, setEditPrice] = useState<string>(String(currentMenu?.pricePerGuest || 0));

  // Check-in state
  const [checkinRoom, setCheckinRoom] = useState('');
  const [checkinGuests, setCheckinGuests] = useState('');

  const todayKey = getTodayDayKey();
  const todayLabel = DAYS.find(d => d.key === todayKey);
  const today = new Date().toISOString().split('T')[0];

  // Sync when day changes
  const handleDayChange = (day: DayOfWeek) => {
    setSelectedDay(day);
    const menu = breakfastMenus[day];
    setEditIngredients(menu?.ingredients || []);
    setEditPrice(String(menu?.pricePerGuest || 0));
  };

  const handleAddIngredient = () => {
    setEditIngredients(prev => [...prev, { productId: '', quantity: 0, lossPercentage: 0 }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setEditIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, field: string, value: any) => {
    setEditIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const handleSaveMenu = () => {
    const validIngredients = editIngredients.filter(i => i.productId && i.quantity > 0);
    saveBreakfastMenu(selectedDay, { ingredients: validIngredients, pricePerGuest: Number(editPrice) || 0 });
    setAlertMessage(language === 'ka' ? 'მენიუ შენახულია!' : 'Menu saved!');
  };

  const handleCheckin = () => {
    if (!checkinRoom || !checkinGuests || Number(checkinGuests) <= 0) return;
    logBreakfast(checkinRoom, Number(checkinGuests));
    setAlertMessage(language === 'ka' ? `ოთახი ${checkinRoom} — ${checkinGuests} სტუმარი, საუზმე ჩამოიწერა!` : `Room ${checkinRoom} — ${checkinGuests} guests, breakfast consumed!`);
    setCheckinRoom('');
    setCheckinGuests('');
  };

  // Today's logs
  const todayLogs = useMemo(() => breakfastLogs.filter(l => l.date === today), [breakfastLogs, today]);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || '—';

  // Room list for quick selection
  const roomNumbers = useMemo(() => rooms.map(r => r.number).sort(), [rooms]);

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-xl"><Coffee className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{language === 'ka' ? 'საუზმე' : 'Breakfast'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {language === 'ka' ? `დღეს: ${todayLabel?.ka}` : `Today: ${todayLabel?.en}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('checkin')} className={`flex-1 px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'checkin' ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <CheckCircle className="w-4 h-4" />
            {language === 'ka' ? 'დილის რეესტრი' : 'Morning Check-in'}
          </button>
          <button onClick={() => setActiveTab('menu')} className={`flex-1 px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'menu' ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <UtensilsCrossed className="w-4 h-4" />
            {language === 'ka' ? 'კვირის მენიუ' : 'Weekly Menu'}
          </button>
        </div>

        {/* ===== MORNING CHECK-IN ===== */}
        {activeTab === 'checkin' && (
          <div className="p-6 space-y-6">
            {/* Today's menu info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-amber-800 mb-2">
                {language === 'ka' ? `დღევანდელი მენიუ (${todayLabel?.ka})` : `Today's Menu (${todayLabel?.en})`}
              </h4>
              {breakfastMenus[todayKey]?.ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {breakfastMenus[todayKey].ingredients.map((ing, i) => (
                    <span key={i} className="text-xs bg-white px-2 py-1 rounded-lg border border-amber-200 font-medium text-amber-700">
                      {getProductName(ing.productId)} × {ing.quantity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600">{language === 'ka' ? 'მენიუ არ არის გაწერილი' : 'No menu configured'}</p>
              )}
            </div>

            {/* Check-in form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{language === 'ka' ? 'ოთახი' : 'Room'}</label>
                {roomNumbers.length > 0 ? (
                  <select value={checkinRoom} onChange={e => setCheckinRoom(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-amber-500 focus:border-amber-500">
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {roomNumbers.map(rn => <option key={rn} value={rn}>{rn}</option>)}
                  </select>
                ) : (
                  <input type="text" value={checkinRoom} onChange={e => setCheckinRoom(e.target.value)} placeholder="101" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-amber-500 focus:border-amber-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{language === 'ka' ? 'სტუმრები' : 'Guests'}</label>
                <input type="number" min="1" value={checkinGuests} onChange={e => setCheckinGuests(e.target.value)} placeholder="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <button onClick={handleCheckin} disabled={!checkinRoom || !checkinGuests} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {language === 'ka' ? 'დასტური' : 'Confirm'}
              </button>
            </div>

            {/* Today's log */}
            {todayLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">{language === 'ka' ? 'დღევანდელი ჩანაწერები' : "Today's Records"}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'ოთახი' : 'Room'}</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'სტუმრები' : 'Guests'}</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'დღე' : 'Day'}</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {todayLogs.map((log, i) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 font-bold text-gray-900">{log.roomNumber}</td>
                          <td className="px-4 py-2 text-gray-700">{log.guestCount}</td>
                          <td className="px-4 py-2 text-gray-500">{DAYS.find(d => d.key === log.dayOfWeek)?.[language === 'ka' ? 'ka' : 'en']}</td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => deleteBreakfastLog(log.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== WEEKLY MENU CONSTRUCTOR ===== */}
        {activeTab === 'menu' && (
          <div className="p-6 space-y-6">
            {/* Day selector */}
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day.key}
                  onClick={() => handleDayChange(day.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedDay === day.key
                      ? 'bg-amber-600 text-white shadow-sm'
                      : day.key === todayKey
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language === 'ka' ? day.ka : day.en}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="max-w-xs">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{language === 'ka' ? 'ფასი 1 სტუმარზე (₾)' : 'Price per guest (₾)'}</label>
              <input type="number" min="0" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-amber-500 focus:border-amber-500" />
              <p className="text-xs text-gray-400 mt-1">{language === 'ka' ? '0 = ოთახში შემავალია' : '0 = included in room rate'}</p>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">{language === 'ka' ? 'ინგრედიენტები (1 სტუმარზე)' : 'Ingredients (per 1 guest)'}</h4>
                <button onClick={handleAddIngredient} className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100">
                  <Plus className="w-3.5 h-3.5 mr-1" />{language === 'ka' ? 'დამატება' : 'Add'}
                </button>
              </div>

              {editIngredients.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">{language === 'ka' ? 'ინგრედიენტები არ არის დამატებული' : 'No ingredients added'}</p>
              ) : (
                <div className="space-y-2">
                  {editIngredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                      <div className="col-span-5">
                        <select value={ing.productId} onChange={e => handleIngredientChange(idx, 'productId', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
                          <option value="">{language === 'ka' ? 'პროდუქტი...' : 'Product...'}</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" step="0.001" value={ing.quantity || ''} onChange={e => handleIngredientChange(idx, 'quantity', Number(e.target.value))} placeholder={language === 'ka' ? 'რაოდ.' : 'Qty'} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" max="99" value={ing.lossPercentage || ''} onChange={e => handleIngredientChange(idx, 'lossPercentage', Number(e.target.value))} placeholder="% loss" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                      </div>
                      <div className="col-span-1 text-center">
                        <button onClick={() => handleRemoveIngredient(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSaveMenu} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all active:scale-95 shadow-sm">
              <Save className="w-4 h-4 inline mr-2" />
              {language === 'ka' ? 'მენიუს შენახვა' : 'Save Menu'}
            </button>
          </div>
        )}
      </div>

      {/* Alert */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};