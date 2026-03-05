import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { HousekeepingBOMItem, RoomStatus } from '../types';
import { Sparkles, Plus, Trash2, Save, Home, Settings, Users, ClipboardList } from 'lucide-react';

const STATUS_COLORS: Record<RoomStatus, { bg: string; text: string; border: string; label_ka: string; label_en: string; emoji: string }> = {
  dirty: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label_ka: 'ბინძური', label_en: 'Dirty', emoji: '🔴' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label_ka: 'მუშავდება', label_en: 'In Progress', emoji: '🟡' },
  clean: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label_ka: 'სუფთა', label_en: 'Clean', emoji: '🟢' },
};

const STATUS_ORDER: RoomStatus[] = ['dirty', 'in_progress', 'clean'];

export const HousekeepingPage: React.FC = () => {
  const { language, products, rooms, addRoom, deleteRoom, updateRoomStatus, housekeepingBOM, saveHousekeepingBOM, housekeepingLogs } = useAppStore();

  const deptProducts = useMemo(() => products.filter(p => (p.department || 'restaurant') === 'housekeeping'), [products]);

  const [activeTab, setActiveTab] = useState<'rooms' | 'bom' | 'setup'>('rooms');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // BOM editor
  const [editBOM, setEditBOM] = useState<HousekeepingBOMItem[]>(housekeepingBOM || []);

  // Room setup
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');

  // Guest count modal for status change
  const [statusModal, setStatusModal] = useState<{ roomId: string; targetStatus: RoomStatus } | null>(null);
  const [modalGuests, setModalGuests] = useState('1');

  const today = new Date().toISOString().split('T')[0];

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const map: Record<number, typeof rooms> = {};
    [...rooms].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).forEach(r => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b));
  }, [rooms]);

  // Today's HK logs
  const todayHKLogs = useMemo(() => housekeepingLogs.filter(l => l.date === today), [housekeepingLogs, today]);

  // Counts
  const counts = useMemo(() => {
    const c = { clean: 0, dirty: 0, in_progress: 0 };
    rooms.forEach(r => c[r.status]++);
    return c;
  }, [rooms]);

  // Handle room status click
  const handleStatusClick = (roomId: string, currentStatus: RoomStatus) => {
    const nextIdx = (STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length;
    const targetStatus = STATUS_ORDER[nextIdx];

    // If going to dirty (check-out), ask guest count
    if (targetStatus === 'dirty') {
      setStatusModal({ roomId, targetStatus });
      setModalGuests('1');
      return;
    }

    // If going to clean from in_progress, consume materials
    updateRoomStatus(roomId, targetStatus);
    if (targetStatus === 'clean') {
      setAlertMessage(language === 'ka' ? 'ოთახი გასუფთავდა, მასალები ჩამოიწერა!' : 'Room cleaned, materials consumed!');
    }
  };

  const confirmStatusChange = () => {
    if (!statusModal) return;
    updateRoomStatus(statusModal.roomId, statusModal.targetStatus, Number(modalGuests) || 1);
    setStatusModal(null);
  };

  // BOM handlers
  const handleAddBOMItem = () => setEditBOM(prev => [...prev, { productId: '', quantity: 0 }]);
  const handleRemoveBOMItem = (idx: number) => setEditBOM(prev => prev.filter((_, i) => i !== idx));
  const handleBOMChange = (idx: number, field: string, value: any) => setEditBOM(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const handleSaveBOM = () => {
    saveHousekeepingBOM(editBOM.filter(i => i.productId && i.quantity > 0));
    setAlertMessage(language === 'ka' ? 'სტანდარტი შენახულია!' : 'Standard saved!');
  };

  // Room setup handlers
  const handleAddRoom = () => {
    if (!newRoomNumber.trim()) return;
    addRoom({ number: newRoomNumber.trim(), floor: Number(newRoomFloor) || 1, status: 'clean', guestCount: 0 });
    setNewRoomNumber('');
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || '—';

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-teal-100 p-3 rounded-xl"><Sparkles className="w-6 h-6 text-teal-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{language === 'ka' ? 'ჰაუსქიფინგი' : 'Housekeeping'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{language === 'ka' ? 'ოთახების მართვა და მასალების ჩამოწერა' : 'Room management & material consumption'}</p>
          </div>
        </div>
        {/* Status summary */}
        <div className="flex gap-3">
          {(['clean', 'in_progress', 'dirty'] as RoomStatus[]).map(s => (
            <div key={s} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].text} border ${STATUS_COLORS[s].border}`}>
              {STATUS_COLORS[s].emoji} {counts[s]}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('rooms')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Home className="w-4 h-4" />{language === 'ka' ? 'ოთახები' : 'Rooms'}
          </button>
          <button onClick={() => setActiveTab('bom')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'bom' ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ClipboardList className="w-4 h-4" />{language === 'ka' ? 'სტანდარტი' : 'Standard BOM'}
          </button>
          <button onClick={() => setActiveTab('setup')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'setup' ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Settings className="w-4 h-4" />{language === 'ka' ? 'პარამეტრები' : 'Setup'}
          </button>
        </div>

        {/* ===== ROOM STATUS MAP ===== */}
        {activeTab === 'rooms' && (
          <div className="p-6">
            {rooms.length === 0 ? (
              <div className="py-16 text-center">
                <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{language === 'ka' ? 'ოთახები არ არის დამატებული' : 'No rooms added'}</p>
                <p className="text-sm text-gray-500 mt-1">{language === 'ka' ? 'გადადით "პარამეტრები" ტაბში' : 'Go to "Setup" tab'}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roomsByFloor.map(([floor, floorRooms]) => (
                  <div key={floor}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      {language === 'ka' ? `სართული ${floor}` : `Floor ${floor}`}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {floorRooms.map(room => {
                        const sc = STATUS_COLORS[room.status];
                        return (
                          <button
                            key={room.id}
                            onClick={() => handleStatusClick(room.id, room.status)}
                            className={`relative p-3 rounded-xl border-2 ${sc.border} ${sc.bg} hover:shadow-md transition-all active:scale-95 text-center`}
                          >
                            <span className="text-lg font-black block">{room.number}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text} block mt-0.5`}>
                              {language === 'ka' ? sc.label_ka : sc.label_en}
                            </span>
                            {room.guestCount > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                {room.guestCount}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">{language === 'ka' ? 'დააჭირეთ ოთახს სტატუსის შესაცვლელად:' : 'Click room to change status:'}</p>
                  {STATUS_ORDER.map((s, i) => (
                    <span key={s} className="text-xs text-gray-500">
                      {STATUS_COLORS[s].emoji} {language === 'ka' ? STATUS_COLORS[s].label_ka : STATUS_COLORS[s].label_en}
                      {i < STATUS_ORDER.length - 1 && ' →'}
                    </span>
                  ))}
                </div>

                {/* Today's cleaning log */}
                {todayHKLogs.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">{language === 'ka' ? 'დღევანდელი დასუფთავებები' : "Today's Cleanings"}</h4>
                    <div className="flex flex-wrap gap-2">
                      {todayHKLogs.map(log => (
                        <span key={log.id} className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-lg font-medium">
                          {language === 'ka' ? 'ოთ.' : 'Rm.'} {log.roomNumber} — {log.guestCount} {language === 'ka' ? 'სტუმ.' : 'guests'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== STANDARD CLEANING BOM ===== */}
        {activeTab === 'bom' && (
          <div className="p-6 space-y-6">
            <p className="text-sm text-gray-500">{language === 'ka' ? '1 სტუმარზე საჭირო სახარჯი მასალები:' : 'Consumable materials per 1 guest:'}</p>

            {editBOM.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{language === 'ka' ? 'მასალები არ არის დამატებული' : 'No materials added'}</p>
            ) : (
              <div className="space-y-2">
                {editBOM.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <div className="col-span-7">
                      <select value={item.productId} onChange={e => handleBOMChange(idx, 'productId', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
                        <option value="">{language === 'ka' ? 'პროდუქტი...' : 'Product...'}</option>
                        {deptProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input type="number" min="0" step="0.001" value={item.quantity || ''} onChange={e => handleBOMChange(idx, 'quantity', Number(e.target.value))} placeholder={language === 'ka' ? 'რაოდენობა' : 'Qty'} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" />
                    </div>
                    <div className="col-span-1 text-center">
                      <button onClick={() => handleRemoveBOMItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleAddBOMItem} className="flex items-center px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-100">
                <Plus className="w-3.5 h-3.5 mr-1" />{language === 'ka' ? 'დამატება' : 'Add Item'}
              </button>
              <button onClick={handleSaveBOM} className="flex items-center px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all">
                <Save className="w-3.5 h-3.5 mr-1" />{language === 'ka' ? 'შენახვა' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ===== ROOM SETUP ===== */}
        {activeTab === 'setup' && (
          <div className="p-6 space-y-6">
            {/* Add room form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{language === 'ka' ? 'ოთახის ნომერი' : 'Room Number'}</label>
                <input type="text" value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} placeholder="101" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{language === 'ka' ? 'სართული' : 'Floor'}</label>
                <input type="number" min="1" value={newRoomFloor} onChange={e => setNewRoomFloor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button onClick={handleAddRoom} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700">
                <Plus className="w-4 h-4 inline mr-1" />{language === 'ka' ? 'დამატება' : 'Add'}
              </button>
            </div>

            {/* Room list */}
            {rooms.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'ოთახი' : 'Room'}</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'სართული' : 'Floor'}</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">{language === 'ka' ? 'სტატუსი' : 'Status'}</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rooms.map(room => {
                      const sc = STATUS_COLORS[room.status];
                      return (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-bold text-gray-900">{room.number}</td>
                          <td className="px-4 py-2 text-gray-600">{room.floor}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.emoji} {language === 'ka' ? sc.label_ka : sc.label_en}</span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => deleteRoom(room.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guest Count Modal (for check-out / dirty) */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{language === 'ka' ? 'სტუმრების რაოდენობა' : 'Guest Count'}</h3>
            <p className="text-sm text-gray-500 mb-4">{language === 'ka' ? 'რამდენი სტუმარი იყო ოთახში?' : 'How many guests in the room?'}</p>
            <input type="number" min="1" value={modalGuests} onChange={e => setModalGuests(e.target.value)} autoFocus className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-center mb-4 focus:ring-teal-500 focus:border-teal-500" />
            <div className="flex space-x-3">
              <button onClick={() => setStatusModal(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">{t(language, 'cancel')}</button>
              <button onClick={confirmStatusChange} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold text-sm">{language === 'ka' ? 'დადასტურება' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};