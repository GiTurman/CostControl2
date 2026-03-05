import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { 
  Landmark, Calendar, Search, Download, Plus, Edit2, Trash2, X, 
  CreditCard, FileText, Brain, ChevronDown, ChevronRight, Filter,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ====== Types for Debtor System ======
export interface SupplierPayment {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  note: string;
}

export const DebtorPage: React.FC = () => {
  const { language, purchases, supplierPayments = [], addSupplierPayment, editSupplierPayment, deleteSupplierPayment } = useAppStore() as any;

  // Tab state
  const [activeTab, setActiveTab] = useState<'debts' | 'payments'>('debts');

  // Filter states
  const [searchSupplier, setSearchSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ supplier: '', date: new Date().toISOString().split('T')[0], amount: '', note: '' });
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ supplier: '', date: '', amount: '', note: '' });

  // Modals
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  // Expanded suppliers in debt view
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});

  // ====== Derived Data ======

  // Unique suppliers from purchases
  const allSuppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p: any) => {
      if (p.supplier && p.supplier.trim()) set.add(p.supplier.trim());
    });
    return Array.from(set).sort();
  }, [purchases]);

  // Purchases grouped by supplier with date filtering
  const supplierDebts = useMemo(() => {
    const map: Record<string, { purchases: any[]; totalDebt: number }> = {};

    purchases.forEach((p: any) => {
      if (!p.supplier || !p.supplier.trim()) return;
      const supplier = p.supplier.trim();

      // Apply date filters
      if (dateFrom && p.date < dateFrom) return;
      if (dateTo && p.date > dateTo) return;

      // Apply supplier search filter
      if (searchSupplier && !supplier.toLowerCase().includes(searchSupplier.toLowerCase())) return;
      if (selectedSupplierFilter && supplier !== selectedSupplierFilter) return;

      if (!map[supplier]) map[supplier] = { purchases: [], totalDebt: 0 };
      map[supplier].purchases.push(p);
      map[supplier].totalDebt += p.total;
    });

    return map;
  }, [purchases, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  // Payments grouped by supplier with filtering
  const filteredPayments = useMemo(() => {
    return (supplierPayments || []).filter((pay: SupplierPayment) => {
      if (dateFrom && pay.date < dateFrom) return false;
      if (dateTo && pay.date > dateTo) return false;
      if (searchSupplier && !pay.supplier.toLowerCase().includes(searchSupplier.toLowerCase())) return false;
      if (selectedSupplierFilter && pay.supplier !== selectedSupplierFilter) return false;
      return true;
    });
  }, [supplierPayments, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  // Total payments per supplier (all time, for balance calc)
  const totalPaymentsBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    (supplierPayments || []).forEach((pay: SupplierPayment) => {
      map[pay.supplier] = (map[pay.supplier] || 0) + pay.amount;
    });
    return map;
  }, [supplierPayments]);

  // All-time debt per supplier (no date filter)
  const allTimeDebtBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach((p: any) => {
      if (!p.supplier || !p.supplier.trim()) return;
      const supplier = p.supplier.trim();
      map[supplier] = (map[supplier] || 0) + p.total;
    });
    return map;
  }, [purchases]);

  // Net balance per supplier
  const netBalances = useMemo(() => {
    const result: Record<string, { totalDebt: number; totalPaid: number; balance: number }> = {};
    allSuppliers.forEach(s => {
      const debt = allTimeDebtBySupplier[s] || 0;
      const paid = totalPaymentsBySupplier[s] || 0;
      result[s] = { totalDebt: debt, totalPaid: paid, balance: debt - paid };
    });
    return result;
  }, [allSuppliers, allTimeDebtBySupplier, totalPaymentsBySupplier]);

  // Summary
  const summary = useMemo(() => {
    let totalDebt = 0;
    let totalPaid = 0;
    Object.values(netBalances).forEach(v => {
      totalDebt += v.totalDebt;
      totalPaid += v.totalPaid;
    });
    return { totalDebt, totalPaid, balance: totalDebt - totalPaid, supplierCount: allSuppliers.length };
  }, [netBalances, allSuppliers]);

  // ====== Handlers ======

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.supplier || !paymentForm.amount) return;
    addSupplierPayment({
      supplier: paymentForm.supplier.trim(),
      date: paymentForm.date,
      amount: Number(paymentForm.amount),
      note: paymentForm.note.trim(),
    });
    setPaymentForm({ supplier: '', date: new Date().toISOString().split('T')[0], amount: '', note: '' });
    setShowPaymentForm(false);
    setAlertMessage(language === 'ka' ? 'გადახდა წარმატებით დაემატა' : 'Payment added successfully');
  };

  const handleEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editPaymentForm.supplier || !editPaymentForm.amount) return;
    editSupplierPayment(editingPayment.id, {
      supplier: editPaymentForm.supplier.trim(),
      date: editPaymentForm.date,
      amount: Number(editPaymentForm.amount),
      note: editPaymentForm.note.trim(),
    });
    setEditingPayment(null);
  };

  const openEditPayment = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      supplier: payment.supplier,
      date: payment.date,
      amount: payment.amount.toString(),
      note: payment.note || '',
    });
  };

  const confirmDeletePayment = () => {
    if (itemToDelete) {
      deleteSupplierPayment(itemToDelete);
      setItemToDelete(null);
    }
  };

  const toggleSupplier = (supplier: string) => {
    setExpandedSuppliers(prev => ({ ...prev, [supplier]: !prev[supplier] }));
  };

  const clearFilters = () => {
    setSearchSupplier('');
    setDateFrom('');
    setDateTo('');
    setSelectedSupplierFilter('');
  };

  const handleExport = () => {
    const dataToExport = allSuppliers.map(s => {
      const bal = netBalances[s];
      return {
        [language === 'ka' ? 'მომწოდებელი' : 'Supplier']: s,
        [language === 'ka' ? 'ჯამ. შესყიდვა' : 'Total Purchases']: Number(bal.totalDebt.toFixed(2)),
        [language === 'ka' ? 'ჯამ. გადახდილი' : 'Total Paid']: Number(bal.totalPaid.toFixed(2)),
        [language === 'ka' ? 'ნაშთი (ვალი)' : 'Balance (Debt)']: Number(bal.balance.toFixed(2)),
        [language === 'ka' ? 'სტატუსი' : 'Status']: bal.balance <= 0.01 
          ? (language === 'ka' ? 'დაფარულია' : 'Settled') 
          : (language === 'ka' ? 'ვალი' : 'Outstanding'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ka' ? 'დებიტორი' : 'Debtors');
    XLSX.writeFile(workbook, `Debtors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ====== AI Analysis ======
  const aiAnalysis = useMemo(() => {
    const lines: string[] = [];
    const overdue: string[] = [];
    const highDebt: string[] = [];
    let maxDebtSupplier = '';
    let maxDebt = 0;

    Object.entries(netBalances).forEach(([supplier, bal]) => {
      if (bal.balance > maxDebt) {
        maxDebt = bal.balance;
        maxDebtSupplier = supplier;
      }
      if (bal.balance > 5000) highDebt.push(supplier);
      if (bal.balance > 0 && bal.totalPaid === 0) overdue.push(supplier);
    });

    if (language === 'ka') {
      lines.push(`📊 სულ ${allSuppliers.length} მომწოდებელი, ჯამური ვალი: ${formatCurrency(summary.balance)}`);
      if (maxDebtSupplier) lines.push(`⚠️ ყველაზე დიდი ვალი: "${maxDebtSupplier}" — ${formatCurrency(maxDebt)}`);
      if (highDebt.length > 0) lines.push(`🔴 მაღალი ვალის მქონე მომწოდებლები (>5000): ${highDebt.join(', ')}`);
      if (overdue.length > 0) lines.push(`⏰ არცერთი გადახდა არ განხორციელებულა: ${overdue.join(', ')}`);
      if (summary.balance <= 0) lines.push('✅ ყველა მომწოდებელთან ვალი დაფარულია!');
      
      const paidPercent = summary.totalDebt > 0 ? ((summary.totalPaid / summary.totalDebt) * 100).toFixed(1) : '0';
      lines.push(`💰 გადახდის პროცენტი: ${paidPercent}% (${formatCurrency(summary.totalPaid)} / ${formatCurrency(summary.totalDebt)})`);
      
      if (Number(paidPercent) < 50) {
        lines.push('💡 რეკომენდაცია: გადახდის პროცენტი 50%-ზე ნაკლებია. გადახედეთ გადახდის გრაფიკს.');
      }
    } else {
      lines.push(`📊 Total ${allSuppliers.length} suppliers, outstanding balance: ${formatCurrency(summary.balance)}`);
      if (maxDebtSupplier) lines.push(`⚠️ Highest debt: "${maxDebtSupplier}" — ${formatCurrency(maxDebt)}`);
      if (highDebt.length > 0) lines.push(`🔴 High debt suppliers (>5000): ${highDebt.join(', ')}`);
      if (overdue.length > 0) lines.push(`⏰ No payments made yet: ${overdue.join(', ')}`);
      if (summary.balance <= 0) lines.push('✅ All supplier debts are settled!');
      
      const paidPercent = summary.totalDebt > 0 ? ((summary.totalPaid / summary.totalDebt) * 100).toFixed(1) : '0';
      lines.push(`💰 Payment ratio: ${paidPercent}% (${formatCurrency(summary.totalPaid)} / ${formatCurrency(summary.totalDebt)})`);
      
      if (Number(paidPercent) < 50) {
        lines.push('💡 Recommendation: Payment ratio is below 50%. Consider reviewing your payment schedule.');
      }
    }

    return lines;
  }, [netBalances, allSuppliers, summary, language]);

  // ====== Render ======
  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-xl shrink-0">
            <Landmark className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ka' ? 'დებიტორი / კრედიტორი' : 'Accounts Payable'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {language === 'ka' ? 'მომწოდებლების ვალების და გადახდების მართვა' : 'Manage supplier debts and payments'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAiAnalysis(!showAiAnalysis)}
            className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI {language === 'ka' ? 'ანალიზი' : 'Analysis'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {showAiAnalysis && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI {language === 'ka' ? 'ანალიზი და კომენტარი' : 'Analysis & Commentary'}
          </h3>
          <div className="space-y-2">
            {aiAnalysis.map((line, i) => (
              <p key={i} className="text-sm text-indigo-800 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'ka' ? 'მომწოდებლები' : 'Suppliers'}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{summary.supplierCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'ka' ? 'ჯამ. შესყიდვა' : 'Total Purchases'}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(summary.totalDebt)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{language === 'ka' ? 'გადახდილი' : 'Paid'}</p>
          <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-200 bg-red-50/50">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{language === 'ka' ? 'ნაშთი (ვალი)' : 'Outstanding'}</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-bold text-gray-700">{language === 'ka' ? 'ფილტრები' : 'Filters'}</span>
          {(searchSupplier || dateFrom || dateTo || selectedSupplierFilter) && (
            <button onClick={clearFilters} className="ml-auto text-xs text-brand-600 hover:underline font-medium">
              {language === 'ka' ? 'გასუფთავება' : 'Clear'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ka' ? 'მომწოდებლის ძებნა...' : 'Search supplier...'}
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">{language === 'ka' ? 'ყველა მომწოდებელი' : 'All Suppliers'}</option>
            {allSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl overflow-hidden">
        <button
          onClick={() => setActiveTab('debts')}
          className={`flex-1 px-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'debts' ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          {language === 'ka' ? 'დავალიანება' : 'Debts'}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 px-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'payments' ? 'text-green-700 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {language === 'ka' ? 'გადახდები' : 'Payments'}
        </button>
      </div>

      {/* ======= DEBTS TAB ======= */}
      {activeTab === 'debts' && (
        <div className="bg-white rounded-b-2xl rounded-t-none shadow-sm border border-gray-200 border-t-0 overflow-hidden">
          {allSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">{language === 'ka' ? 'მომწოდებლები არ მოიძებნა' : 'No suppliers found'}</p>
              <p className="text-sm text-gray-500 mt-1">{language === 'ka' ? 'დაამატეთ მომწოდებლის სახელი შესყიდვებში' : 'Add supplier names in Purchases'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(supplierDebts).length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {language === 'ka' ? 'არჩეული ფილტრებით მონაცემები არ მოიძებნა' : 'No data found for selected filters'}
                </div>
              ) : (
                Object.entries(supplierDebts)
                  .sort((a, b) => b[1].totalDebt - a[1].totalDebt)
                  .map(([supplier, data]) => {
                    const isExpanded = expandedSuppliers[supplier];
                    const bal = netBalances[supplier];
                    const isSettled = bal && bal.balance <= 0.01;

                    return (
                      <div key={supplier}>
                        <button
                          onClick={() => toggleSupplier(supplier)}
                          className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <div className="flex items-center gap-2">
                              {isSettled ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="font-bold text-gray-900 text-sm">{supplier}</span>
                            </div>
                            <span className="text-xs text-gray-400">({data.purchases.length} {language === 'ka' ? 'ჩანაწერი' : 'records'})</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">{language === 'ka' ? 'შესყიდვა' : 'Purchased'}: <strong className="text-gray-800">{formatCurrency(data.totalDebt)}</strong></span>
                            <span className="text-green-600">{language === 'ka' ? 'გადახდილი' : 'Paid'}: <strong>{formatCurrency(totalPaymentsBySupplier[supplier] || 0)}</strong></span>
                            <span className={`font-black ${isSettled ? 'text-green-600' : 'text-red-600'}`}>
                              {language === 'ka' ? 'ვალი' : 'Owed'}: {formatCurrency(bal?.balance || 0)}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-4 overflow-x-auto">
                            <table className="min-w-full border-collapse text-xs font-mono">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="border border-slate-300 px-2 py-1.5 text-center">#</th>
                                  <th className="border border-slate-300 px-2 py-1.5">{t(language, 'date')}</th>
                                  <th className="border border-slate-300 px-2 py-1.5">{t(language, 'productName')}</th>
                                  <th className="border border-slate-300 px-2 py-1.5 text-right">{t(language, 'quantity')}</th>
                                  <th className="border border-slate-300 px-2 py-1.5 text-right">{t(language, 'price')}</th>
                                  <th className="border border-slate-300 px-2 py-1.5 text-right bg-slate-200/50">{t(language, 'total')}</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {data.purchases
                                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map((p: any, i: number) => {
                                    const prod = (useAppStore.getState() as any).products.find((pr: any) => pr.id === p.productId);
                                    return (
                                      <tr key={p.id} className="hover:bg-blue-50/50">
                                        <td className="border border-slate-200 px-2 py-1 text-center text-slate-400">{i + 1}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-slate-700">{p.date}</td>
                                        <td className="border border-slate-200 px-2 py-1 font-sans font-medium text-slate-900">{prod?.name || 'N/A'}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{p.quantity}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{formatCurrency(p.price)}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-right font-bold text-slate-900 bg-slate-50/50">{formatCurrency(p.total)}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                              <tfoot className="bg-slate-100">
                                <tr>
                                  <td colSpan={5} className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-700">
                                    {language === 'ka' ? 'ჯამი:' : 'Total:'}
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1.5 text-right font-black text-slate-900">{formatCurrency(data.totalDebt)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {/* ======= PAYMENTS TAB ======= */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-b-2xl rounded-t-none shadow-sm border border-gray-200 border-t-0 overflow-hidden">
          
          {/* Add Payment Button */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ka' ? 'გადახდის დამატება' : 'Add Payment'}
            </button>
          </div>

          {/* Add Payment Form */}
          {showPaymentForm && (
            <div className="p-4 bg-green-50 border-b border-green-200">
              <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">{language === 'ka' ? 'მომწოდებელი' : 'Supplier'}</label>
                  <select
                    value={paymentForm.supplier}
                    onChange={(e) => setPaymentForm(p => ({ ...p, supplier: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {allSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">{t(language, 'date')}</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">{language === 'ka' ? 'თანხა' : 'Amount'}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-800 mb-1">{language === 'ka' ? 'შენიშვნა' : 'Note'}</label>
                  <input
                    type="text"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm(p => ({ ...p, note: e.target.value }))}
                    placeholder={language === 'ka' ? 'არასავალდებულო' : 'Optional'}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">
                    {t(language, 'save')}
                  </button>
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payments Table */}
          <div className="overflow-x-auto">
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{language === 'ka' ? 'გადახდები არ მოიძებნა' : 'No payments found'}</p>
                <p className="text-sm text-gray-500 mt-1">{language === 'ka' ? 'დაამატეთ გადახდა ზემოთ ღილაკით' : 'Add a payment using the button above'}</p>
              </div>
            ) : (
              <table className="min-w-full border-collapse text-sm text-left">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t(language, 'date')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{language === 'ka' ? 'მომწოდებელი' : 'Supplier'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-green-600 uppercase tracking-wider text-right">{language === 'ka' ? 'თანხა' : 'Amount'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{language === 'ka' ? 'შენიშვნა' : 'Note'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">{t(language, 'actionsShort') || (language === 'ka' ? 'მოქმ.' : 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments
                    .sort((a: SupplierPayment, b: SupplierPayment) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((pay: SupplierPayment, i: number) => (
                      <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{pay.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{pay.supplier}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(pay.amount)}</td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{pay.note || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditPayment(pay)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(pay.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                      {language === 'ka' ? 'ჯამი:' : 'Total:'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-black text-green-600">
                      {formatCurrency(filteredPayments.reduce((sum: number, p: SupplierPayment) => sum + p.amount, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                {language === 'ka' ? 'გადახდის რედაქტირება' : 'Edit Payment'}
              </h3>
              <button onClick={() => setEditingPayment(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'მომწოდებელი' : 'Supplier'}</label>
                  <select
                    value={editPaymentForm.supplier}
                    onChange={(e) => setEditPaymentForm(p => ({ ...p, supplier: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                  >
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {allSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'date')}</label>
                  <input
                    type="date"
                    value={editPaymentForm.date}
                    onChange={(e) => setEditPaymentForm(p => ({ ...p, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'თანხა' : 'Amount'}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPaymentForm.amount}
                    onChange={(e) => setEditPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? 'შენიშვნა' : 'Note'}</label>
                  <input
                    type="text"
                    value={editPaymentForm.note}
                    onChange={(e) => setEditPaymentForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingPayment(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    {t(language, 'cancel')}
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm">
                    {t(language, 'save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{language === 'ka' ? 'ყურადღება' : 'Warning'}</h3>
            <p className="text-sm text-gray-600 mb-6">{language === 'ka' ? 'ნამდვილად გსურთ წაშლა?' : 'Are you sure you want to delete?'}</p>
            <div className="flex space-x-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">{t(language, 'cancel')}</button>
              <button onClick={confirmDeletePayment} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">{t(language, 'delete') || 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{language === 'ka' ? 'შეტყობინება' : 'Notification'}</h3>
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};