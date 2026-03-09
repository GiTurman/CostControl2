import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { TechnicalBOMItem } from '../types';
import { Wrench, Plus, Trash2, Save, Settings, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';

export const TechnicalPage: React.FC = () => {
  const { 
    language, 
    getProducts, 
    getTechnicalBOM, 
    saveTechnicalBOM, 
    getTechnicalLogs, 
    logTechnical,
    deleteTechnicalLog,
    getDirectConsumptions, 
    addDirectConsumption, 
    deleteDirectConsumption 
  } = useAppStore();
  
  const [searchParams] = useSearchParams();
  const products = getProducts();
  const technicalBOM = getTechnicalBOM();
  const technicalLogs = getTechnicalLogs();
  const directConsumptions = getDirectConsumptions();

  const deptProducts = useMemo(() => products.filter(p => (p.department || 'restaurant') === 'technical'), [products]);
  const allProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'bom' | 'consumption' | 'setup'>('tasks');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'consumption' || tab === 'tasks' || tab === 'bom' || tab === 'setup') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Manual Consumption state
  const [consDate, setConsDate] = useState(new Date().toISOString().split('T')[0]);
  const [consProductId, setConsProductId] = useState('');
  const [consQuantity, setConsQuantity] = useState('');

  // BOM editor
  const [editBOM, setEditBOM] = useState<TechnicalBOMItem[]>(technicalBOM || []);

  // Task setup (for this analog, we'll use a simple list of task names)
  const [newTaskName, setNewTaskName] = useState('');
  // We'll store tasks in a simple way for this demo, or just use the BOM as the task definition
  // Actually, let's assume the BOM *is* the task definition for now, or add a simple task list.
  // For simplicity and matching the "analog" request, let's treat it as "Maintenance Events".

  const handleLogTask = (taskName: string, qty: number = 1) => {
    logTechnical(taskName, qty);
    setAlertMessage(language === 'ka' ? 'დავალება შესრულდა, მასალები ჩამოიწერა!' : 'Task completed, materials consumed!');
  };

  // BOM handlers
  const handleAddBOMItem = () => setEditBOM(prev => [...prev, { productId: '', quantity: 0 }]);
  const handleRemoveBOMItem = (idx: number) => setEditBOM(prev => prev.filter((_, i) => i !== idx));
  const handleBOMChange = (idx: number, field: string, value: any) => setEditBOM(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const handleSaveBOM = () => {
    saveTechnicalBOM(editBOM.filter(i => i.productId && i.quantity > 0));
    setAlertMessage(language === 'ka' ? 'სტანდარტი შენახულია!' : 'Standard saved!');
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || '—';

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-xl"><Wrench className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{language === 'ka' ? 'ტექნიკური' : 'Technical'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{language === 'ka' ? 'ტექნიკური მომსახურება და მასალების აღრიცხვა' : 'Technical maintenance & material tracking'}</p>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('tasks')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <CheckCircle2 className="w-4 h-4" />{language === 'ka' ? 'დავალებები' : 'Tasks'}
          </button>
          <button onClick={() => setActiveTab('bom')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'bom' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ClipboardList className="w-4 h-4" />{language === 'ka' ? 'სტანდარტი' : 'Standard BOM'}
          </button>
          <button onClick={() => setActiveTab('consumption')} className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'consumption' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ClipboardList className="w-4 h-4" />{language === 'ka' ? 'ხარჯვა' : 'Consumption'}
          </button>
        </div>

        {/* ===== TASKS ===== */}
        {activeTab === 'tasks' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {language === 'ka' ? 'დავალების შესრულება' : 'Log Task Execution'}
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-blue-700 mb-1.5">{language === 'ka' ? 'დავალების დასახელება' : 'Task Name'}</label>
                  <input 
                    type="text" 
                    value={newTaskName} 
                    onChange={e => setNewTaskName(e.target.value)} 
                    placeholder={language === 'ka' ? "მაგ: ნათურის შეცვლა" : "e.g. Lightbulb replacement"}
                    className="w-full px-4 py-2 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!newTaskName.trim()) return;
                    handleLogTask(newTaskName.trim());
                    setNewTaskName('');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                  {language === 'ka' ? 'შესრულება' : 'Complete'}
                </button>
              </div>
              <p className="text-[10px] text-blue-600 mt-2 italic">
                {language === 'ka' ? '* დავალების შესრულებისას ავტომატურად ჩამოიწერება "სტანდარტში" გაწერილი მასალები' : '* Materials defined in "Standard BOM" will be automatically deducted upon completion'}
              </p>
            </div>

            {/* Task History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                {language === 'ka' ? 'შესრულებული დავალებები' : 'Task History'}
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">{language === 'ka' ? 'თარიღი' : 'Date'}</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">{language === 'ka' ? 'დავალება' : 'Task'}</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-500 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {technicalLogs
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{log.date}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{log.taskName}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => deleteTechnicalLog(log.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    {technicalLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-gray-400 italic">
                          {language === 'ka' ? 'დავალებები არ ფიქსირდება' : 'No tasks recorded'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== STANDARD BOM ===== */}
        {activeTab === 'bom' && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                {language === 'ka' 
                  ? 'აქ გაწერილი მასალები ავტომატურად ჩამოიწერება ყოველი დავალების შესრულებისას. გამოიყენეთ საშუალო ხარჯი ერთ დავალებაზე.' 
                  : 'Materials defined here will be automatically deducted for every task completion. Use average consumption per task.'}
              </p>
            </div>

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
              <button onClick={handleAddBOMItem} className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100">
                <Plus className="w-3.5 h-3.5 mr-1" />{language === 'ka' ? 'დამატება' : 'Add Item'}
              </button>
              <button onClick={handleSaveBOM} className="flex items-center px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                <Save className="w-3.5 h-3.5 mr-1" />{language === 'ka' ? 'შენახვა' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ===== MANUAL CONSUMPTION ===== */}
        {activeTab === 'consumption' && (
          <div className="p-6 space-y-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                {language === 'ka' ? 'ახალი ხარჯვა' : 'New Consumption'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{language === 'ka' ? 'თარიღი' : 'Date'}</label>
                  <input type="date" value={consDate} onChange={e => setConsDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{language === 'ka' ? 'პროდუქტი' : 'Product'}</label>
                  <select value={consProductId} onChange={e => setConsProductId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white">
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {allProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{language === 'ka' ? 'რაოდენობა' : 'Quantity'}</label>
                  <input type="number" min="0" step="0.001" value={consQuantity} onChange={e => setConsQuantity(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                </div>
                <button 
                  onClick={() => {
                    if (!consProductId || !consQuantity) return;
                    addDirectConsumption({
                      date: consDate,
                      productId: consProductId,
                      quantity: Number(consQuantity),
                      source: 'manual',
                      department: 'technical'
                    });
                    setConsProductId('');
                    setConsQuantity('');
                    setAlertMessage(language === 'ka' ? 'ხარჯვა დამატებულია!' : 'Consumption added!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                  {language === 'ka' ? 'დამატება' : 'Add'}
                </button>
              </div>
            </div>

            {/* Consumption History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                {language === 'ka' ? 'ხარჯვის ისტორია' : 'Consumption History'}
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full text-sm divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-500">{language === 'ka' ? 'თარიღი' : 'Date'}</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500">{language === 'ka' ? 'პროდუქტი' : 'Product'}</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500">{language === 'ka' ? 'რაოდენობა' : 'Quantity'}</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500">{language === 'ka' ? 'წყარო' : 'Source'}</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-500 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {directConsumptions
                      .filter(c => c.department === 'technical')
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 50)
                      .map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{c.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{getProductName(c.productId)}</td>
                          <td className="px-4 py-3 text-slate-700">{c.quantity} {products.find(p => p.id === c.productId)?.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.source === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                              {c.source === 'manual' ? (language === 'ka' ? 'ხელით' : 'Manual') : (language === 'ka' ? 'ავტო' : 'Auto')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => deleteDirectConsumption(c.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    {directConsumptions.filter(c => c.department === 'technical').length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                          {language === 'ka' ? 'ხარჯვა არ ფიქსირდება' : 'No consumption records found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};
