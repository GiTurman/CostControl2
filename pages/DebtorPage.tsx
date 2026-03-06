import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { 
  Landmark, Calendar, Search, Download, Plus, Edit2, Trash2, X, 
  CreditCard, FileText, Brain, ChevronDown, ChevronRight, Filter,
  CheckCircle, Clock, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

export const DebtorPage: React.FC = () => {
  const { 
    language, getPurchases, getProducts, getSupplierPayments, getCustomerPayments, 
    getBreakfastLogs, addSupplierPayment, editSupplierPayment, deleteSupplierPayment,
    addCustomerPayment, editCustomerPayment, deleteCustomerPayment
  } = useAppStore();
  const purchases = getPurchases();
  const products = getProducts();
  const supplierPayments = getSupplierPayments();
  const customerPayments = getCustomerPayments();
  const breakfastLogs = getBreakfastLogs();

  // Read tab from URL query param
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'debts' | 'payments'>(tabFromUrl === 'payments' ? 'payments' : 'debts');
  const [viewMode, setViewMode] = useState<'suppliers' | 'customers'>('suppliers');

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'payments' || t === 'debts') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'debts' | 'payments') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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

  // ====== Helper: get product name by id ======
  const getProductName = (productId: string): string => {
    const p = products.find((pr: any) => pr.id === productId);
    return p?.name || 'N/A';
  };

  // ====== Derived Data (Suppliers) ======

  // Unique suppliers from purchases (only valid string names, not numbers)
  const allSuppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p: any) => {
      const sup = p.supplier;
      if (sup && typeof sup === 'string' && sup.trim() && isNaN(Number(sup.trim()))) {
        set.add(sup.trim());
      }
    });
    return Array.from(set).sort();
  }, [purchases]);

  // Purchases grouped by supplier with date filtering
  const supplierDebts = useMemo(() => {
    const map: Record<string, { purchases: any[]; totalDebt: number }> = {};

    purchases.forEach((p: any) => {
      const sup = p.supplier;
      if (!sup || typeof sup !== 'string' || !sup.trim() || !isNaN(Number(sup.trim()))) return;
      const supplier = sup.trim();

      if (dateFrom && p.date < dateFrom) return;
      if (dateTo && p.date > dateTo) return;
      if (searchSupplier && !supplier.toLowerCase().includes(searchSupplier.toLowerCase())) return;
      if (selectedSupplierFilter && supplier !== selectedSupplierFilter) return;

      if (!map[supplier]) map[supplier] = { purchases: [], totalDebt: 0 };
      map[supplier].purchases.push(p);
      map[supplier].totalDebt += p.total;
    });

    return map;
  }, [purchases, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  // Payments filtered
  const filteredPayments = useMemo(() => {
    return (supplierPayments || []).filter((pay: SupplierPayment) => {
      if (dateFrom && pay.date < dateFrom) return false;
      if (dateTo && pay.date > dateTo) return false;
      if (searchSupplier && !pay.supplier.toLowerCase().includes(searchSupplier.toLowerCase())) return false;
      if (selectedSupplierFilter && pay.supplier !== selectedSupplierFilter) return false;
      return true;
    });
  }, [supplierPayments, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  // Total payments per supplier (all time)
  const totalPaymentsBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    (supplierPayments || []).forEach((pay: SupplierPayment) => {
      map[pay.supplier] = (map[pay.supplier] || 0) + pay.amount;
    });
    return map;
  }, [supplierPayments]);

  // All-time debt per supplier
  const allTimeDebtBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach((p: any) => {
      const sup = p.supplier;
      if (!sup || typeof sup !== 'string' || !sup.trim() || !isNaN(Number(sup.trim()))) return;
      const supplier = sup.trim();
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
    Object.values(netBalances).forEach((v: any) => {
      totalDebt += v.totalDebt;
      totalPaid += v.totalPaid;
    });
    return { totalDebt, totalPaid, balance: totalDebt - totalPaid, count: allSuppliers.length };
  }, [netBalances, allSuppliers]);

  // ====== Derived Data (Customers) ======

  const allCustomers = useMemo(() => {
    const set = new Set<string>();
    breakfastLogs.forEach((l: any) => {
      if (l.debtor && typeof l.debtor === 'string' && l.debtor.trim()) {
        set.add(l.debtor.trim());
      }
    });
    return Array.from(set).sort();
  }, [breakfastLogs]);

  const customerDebts = useMemo(() => {
    const map: Record<string, { logs: any[]; totalDebt: number }> = {};

    breakfastLogs.forEach((l: any) => {
      if (!l.debtor || typeof l.debtor !== 'string' || !l.debtor.trim()) return;
      const customer = l.debtor.trim();

      if (dateFrom && l.date < dateFrom) return;
      if (dateTo && l.date > dateTo) return;
      if (searchSupplier && !customer.toLowerCase().includes(searchSupplier.toLowerCase())) return;
      if (selectedSupplierFilter && customer !== selectedSupplierFilter) return;

      if (!map[customer]) map[customer] = { logs: [], totalDebt: 0 };
      map[customer].logs.push(l);
      map[customer].totalDebt += (l.totalRevenue || 0);
    });

    return map;
  }, [breakfastLogs, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  const filteredCustomerPayments = useMemo(() => {
    return (customerPayments || []).filter((pay: CustomerPayment) => {
      if (dateFrom && pay.date < dateFrom) return false;
      if (dateTo && pay.date > dateTo) return false;
      if (searchSupplier && !pay.customer.toLowerCase().includes(searchSupplier.toLowerCase())) return false;
      if (selectedSupplierFilter && pay.customer !== selectedSupplierFilter) return false;
      return true;
    });
  }, [customerPayments, dateFrom, dateTo, searchSupplier, selectedSupplierFilter]);

  const totalPaymentsByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    (customerPayments || []).forEach((pay: CustomerPayment) => {
      map[pay.customer] = (map[pay.customer] || 0) + pay.amount;
    });
    return map;
  }, [customerPayments]);

  const allTimeDebtByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    breakfastLogs.forEach((l: any) => {
      if (!l.debtor || typeof l.debtor !== 'string' || !l.debtor.trim()) return;
      const customer = l.debtor.trim();
      map[customer] = (map[customer] || 0) + (l.totalRevenue || 0);
    });
    return map;
  }, [breakfastLogs]);

  const netCustomerBalances = useMemo(() => {
    const result: Record<string, { totalDebt: number; totalPaid: number; balance: number }> = {};
    allCustomers.forEach(c => {
      const debt = allTimeDebtByCustomer[c] || 0;
      const paid = totalPaymentsByCustomer[c] || 0;
      result[c] = { totalDebt: debt, totalPaid: paid, balance: debt - paid };
    });
    return result;
  }, [allCustomers, allTimeDebtByCustomer, totalPaymentsByCustomer]);

  const customerSummary = useMemo(() => {
    let totalDebt = 0;
    let totalPaid = 0;
    Object.values(netCustomerBalances).forEach((v: any) => {
      totalDebt += v.totalDebt;
      totalPaid += v.totalPaid;
    });
    return { totalDebt, totalPaid, balance: totalDebt - totalPaid, count: allCustomers.length };
  }, [netCustomerBalances, allCustomers]);


  // ====== Handlers ======

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.supplier || !paymentForm.amount) return;
    
    if (viewMode === 'suppliers') {
      addSupplierPayment({
        supplier: paymentForm.supplier.trim(),
        date: paymentForm.date,
        amount: Number(paymentForm.amount),
        note: paymentForm.note.trim(),
      });
    } else {
      addCustomerPayment({
        customer: paymentForm.supplier.trim(),
        date: paymentForm.date,
        amount: Number(paymentForm.amount),
        note: paymentForm.note.trim(),
      });
    }
    
    setPaymentForm({ supplier: '', date: new Date().toISOString().split('T')[0], amount: '', note: '' });
    setShowPaymentForm(false);
    setAlertMessage(language === 'ka' ? 'გადახდა წარმატებით დაემატა' : 'Payment added successfully');
  };

  const handleEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editPaymentForm.supplier || !editPaymentForm.amount) return;
    
    if (viewMode === 'suppliers') {
      editSupplierPayment(editingPayment.id, {
        supplier: editPaymentForm.supplier.trim(),
        date: editPaymentForm.date,
        amount: Number(editPaymentForm.amount),
        note: editPaymentForm.note.trim(),
      });
    } else {
      editCustomerPayment(editingPayment.id, {
        customer: editPaymentForm.supplier.trim(),
        date: editPaymentForm.date,
        amount: Number(editPaymentForm.amount),
        note: editPaymentForm.note.trim(),
      });
    }
    setEditingPayment(null);
  };

  const openEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      supplier: payment.supplier || payment.customer,
      date: payment.date,
      amount: payment.amount.toString(),
      note: payment.note || '',
    });
  };

  const confirmDeletePayment = () => {
    if (itemToDelete) {
      if (viewMode === 'suppliers') {
        deleteSupplierPayment(itemToDelete);
      } else {
        deleteCustomerPayment(itemToDelete);
      }
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
    const dataToExport = (viewMode === 'suppliers' ? allSuppliers : allCustomers).map(s => {
      const bal = viewMode === 'suppliers' ? netBalances[s] : netCustomerBalances[s];
      return {
        [language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებელი' : 'კომპანია/დებიტორი') : (viewMode === 'suppliers' ? 'Supplier' : 'Customer')]: s,
        [language === 'ka' ? (viewMode === 'suppliers' ? 'ჯამ. შესყიდვა' : 'ჯამ. გაყიდვა') : (viewMode === 'suppliers' ? 'Total Purchases' : 'Total Sales')]: Number(bal.totalDebt.toFixed(2)),
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
    XLSX.writeFile(workbook, `Debtors_${viewMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ====== AI Analysis ======
  const aiAnalysis = useMemo(() => {
    const lines: string[] = [];
    const overdue: string[] = [];
    const highDebt: string[] = [];
    let maxDebtEntity = '';
    let maxDebt = 0;

    const currentBalances = viewMode === 'suppliers' ? netBalances : netCustomerBalances;
    const currentList = viewMode === 'suppliers' ? allSuppliers : allCustomers;
    const currentSummary = viewMode === 'suppliers' ? summary : customerSummary;
    const entityNameKa = viewMode === 'suppliers' ? 'მომწოდებელი' : 'კომპანია';
    const entityNameEn = viewMode === 'suppliers' ? 'suppliers' : 'customers';

    Object.entries(currentBalances).forEach(([entity, bal]: [string, any]) => {
      if (bal.balance > maxDebt) {
        maxDebt = bal.balance;
        maxDebtEntity = entity;
      }
      if (bal.balance > 5000) highDebt.push(entity);
      if (bal.balance > 0 && bal.totalPaid === 0) overdue.push(entity);
    });

    if (language === 'ka') {
      lines.push(`📊 სულ ${currentList.length} ${entityNameKa}, ჯამური ვალი: ${formatCurrency(currentSummary.balance)}`);
      if (maxDebtEntity) lines.push(`⚠️ ყველაზე დიდი ვალი: "${maxDebtEntity}" — ${formatCurrency(maxDebt)}`);
      if (highDebt.length > 0) lines.push(`🔴 მაღალი ვალის მქონე ${entityNameKa}ები (>5000): ${highDebt.join(', ')}`);
      if (overdue.length > 0) lines.push(`⏰ არცერთი გადახდა არ განხორციელებულა: ${overdue.join(', ')}`);
      if (currentSummary.balance <= 0) lines.push(`✅ ყველა ${entityNameKa}სთან ვალი დაფარულია!`);
      const paidPercent = currentSummary.totalDebt > 0 ? ((currentSummary.totalPaid / currentSummary.totalDebt) * 100).toFixed(1) : '0';
      lines.push(`💰 გადახდის პროცენტი: ${paidPercent}% (${formatCurrency(currentSummary.totalPaid)} / ${formatCurrency(currentSummary.totalDebt)})`);
      if (Number(paidPercent) < 50) {
        lines.push('💡 რეკომენდაცია: გადახდის პროცენტი 50%-ზე ნაკლებია. გადახედეთ გადახდის გრაფიკს.');
      }
    } else {
      lines.push(`📊 Total ${currentList.length} ${entityNameEn}, outstanding balance: ${formatCurrency(currentSummary.balance)}`);
      if (maxDebtEntity) lines.push(`⚠️ Highest debt: "${maxDebtEntity}" — ${formatCurrency(maxDebt)}`);
      if (highDebt.length > 0) lines.push(`🔴 High debt ${entityNameEn} (>5000): ${highDebt.join(', ')}`);
      if (overdue.length > 0) lines.push(`⏰ No payments made yet: ${overdue.join(', ')}`);
      if (currentSummary.balance <= 0) lines.push(`✅ All ${entityNameEn} debts are settled!`);
      const paidPercent = currentSummary.totalDebt > 0 ? ((currentSummary.totalPaid / currentSummary.totalDebt) * 100).toFixed(1) : '0';
      lines.push(`💰 Payment ratio: ${paidPercent}% (${formatCurrency(currentSummary.totalPaid)} / ${formatCurrency(currentSummary.totalDebt)})`);
      if (Number(paidPercent) < 50) {
        lines.push('💡 Recommendation: Payment ratio is below 50%. Consider reviewing your payment schedule.');
      }
    }

    return lines;
  }, [netBalances, netCustomerBalances, allSuppliers, allCustomers, summary, customerSummary, language, viewMode]);

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
              {language === 'ka' ? 'დებიტორი / კრედიტორი' : 'Accounts Payable / Receivable'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {language === 'ka' ? 'მომწოდებლების და კომპანიების ვალების მართვა' : 'Manage supplier and customer debts'}
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner mx-auto lg:mx-0">
          <button 
            onClick={() => { setViewMode('suppliers'); clearFilters(); }} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'suppliers' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Landmark className="w-4 h-4" />
            {language === 'ka' ? 'კრედიტორები (მომწოდებლები)' : 'Creditors (Suppliers)'}
          </button>
          <button 
            onClick={() => { setViewMode('customers'); clearFilters(); }} 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'customers' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" />
            {language === 'ka' ? 'დებიტორები (კომპანიები)' : 'Debtors (Customers)'}
          </button>
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებლები' : 'კომპანიები') : (viewMode === 'suppliers' ? 'Suppliers' : 'Customers')}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{viewMode === 'suppliers' ? summary.count : customerSummary.count}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === 'ka' ? (viewMode === 'suppliers' ? 'ჯამ. შესყიდვა' : 'ჯამ. გაყიდვა') : (viewMode === 'suppliers' ? 'Total Purchases' : 'Total Sales')}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(viewMode === 'suppliers' ? summary.totalDebt : customerSummary.totalDebt)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{language === 'ka' ? 'გადახდილი' : 'Paid'}</p>
          <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(viewMode === 'suppliers' ? summary.totalPaid : customerSummary.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-200 bg-red-50/50">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{language === 'ka' ? 'ნაშთი (ვალი)' : 'Outstanding'}</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(viewMode === 'suppliers' ? summary.balance : customerSummary.balance)}</p>
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
              placeholder={language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებლის ძებნა...' : 'კომპანიის ძებნა...') : (viewMode === 'suppliers' ? 'Search supplier...' : 'Search customer...')}
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
            <option value="">{language === 'ka' ? (viewMode === 'suppliers' ? 'ყველა მომწოდებელი' : 'ყველა კომპანია') : (viewMode === 'suppliers' ? 'All Suppliers' : 'All Customers')}</option>
            {(viewMode === 'suppliers' ? allSuppliers : allCustomers).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs + Content (single wrapper, no gap) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('debts')}
            className={`flex-1 px-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'debts' ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            {language === 'ka' ? 'დავალიანება' : 'Debts'}
          </button>
          <button
            onClick={() => handleTabChange('payments')}
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
          <div>
            {(viewMode === 'suppliers' ? allSuppliers : allCustomers).length === 0 ? (
              <div className="p-12 text-center">
                <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{language === 'ka' ? 'ჩანაწერები არ მოიძებნა' : 'No records found'}</p>
                <p className="text-sm text-gray-500 mt-1">{language === 'ka' ? 'დაამატეთ შესაბამისი ჩანაწერები' : 'Add relevant records'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(viewMode === 'suppliers' ? supplierDebts : customerDebts).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    {language === 'ka' ? 'არჩეული ფილტრებით მონაცემები არ მოიძებნა' : 'No data found for selected filters'}
                  </div>
                ) : (
                  Object.entries(viewMode === 'suppliers' ? supplierDebts : customerDebts)
                    .sort((a: [string, any], b: [string, any]) => b[1].totalDebt - a[1].totalDebt)
                    .map(([entityName, data]: [string, any]) => {
                      const isExpanded = expandedSuppliers[entityName];
                      const bal = viewMode === 'suppliers' ? netBalances[entityName] : netCustomerBalances[entityName];
                      const isSettled = bal && bal.balance <= 0.01;

                      return (
                        <div key={entityName}>
                          <button
                            onClick={() => toggleSupplier(entityName)}
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
                                <span className="font-bold text-gray-900 text-sm">{entityName}</span>
                              </div>
                              <span className="text-xs text-gray-400">({viewMode === 'suppliers' ? data.purchases.length : data.logs.length} {language === 'ka' ? 'ჩანაწერი' : 'records'})</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500">{language === 'ka' ? (viewMode === 'suppliers' ? 'შესყიდვა' : 'გაყიდვა') : (viewMode === 'suppliers' ? 'Purchased' : 'Sold')}: <strong className="text-gray-800">{formatCurrency(data.totalDebt)}</strong></span>
                              <span className="text-green-600">{language === 'ka' ? 'გადახდილი' : 'Paid'}: <strong>{formatCurrency((viewMode === 'suppliers' ? totalPaymentsBySupplier : totalPaymentsByCustomer)[entityName] || 0)}</strong></span>
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
                                    <th className="border border-slate-300 px-2 py-1.5">{viewMode === 'suppliers' ? t(language, 'productName') : (language === 'ka' ? 'დეტალები' : 'Details')}</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right">{viewMode === 'suppliers' ? t(language, 'quantity') : (language === 'ka' ? 'სტუმრები' : 'Guests')}</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right">{viewMode === 'suppliers' ? t(language, 'price') : ''}</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right bg-slate-200/50">{t(language, 'total')}</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {(viewMode === 'suppliers' ? data.purchases : data.logs)
                                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((p: any, i: number) => (
                                      <tr key={p.id} className="hover:bg-blue-50/50">
                                        <td className="border border-slate-200 px-2 py-1 text-center text-slate-400">{i + 1}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-slate-700">{p.date}</td>
                                        <td className="border border-slate-200 px-2 py-1 font-sans font-medium text-slate-900">
                                          {viewMode === 'suppliers' ? getProductName(p.productId) : `Room ${p.roomNumber} (${p.dayOfWeek})`}
                                        </td>
                                        <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{viewMode === 'suppliers' ? p.quantity : p.guestCount}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{viewMode === 'suppliers' ? formatCurrency(p.price) : ''}</td>
                                        <td className="border border-slate-200 px-2 py-1 text-right font-bold text-slate-900 bg-slate-50/50">{formatCurrency(viewMode === 'suppliers' ? p.total : (p.totalRevenue || 0))}</td>
                                      </tr>
                                    ))}
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
          <div>
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
                    <label className="block text-xs font-bold text-green-800 mb-1">{language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებელი' : 'კომპანია') : (viewMode === 'suppliers' ? 'Supplier' : 'Customer')}</label>
                    <select
                      value={paymentForm.supplier}
                      onChange={(e) => setPaymentForm(p => ({ ...p, supplier: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                      {(viewMode === 'suppliers' ? allSuppliers : allCustomers).map(s => <option key={s} value={s}>{s}</option>)}
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
              {(viewMode === 'suppliers' ? filteredPayments : filteredCustomerPayments).length === 0 ? (
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
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებელი' : 'კომპანია') : (viewMode === 'suppliers' ? 'Supplier' : 'Customer')}</th>
                      <th className="px-4 py-3 text-xs font-bold text-green-600 uppercase tracking-wider text-right">{language === 'ka' ? 'თანხა' : 'Amount'}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{language === 'ka' ? 'შენიშვნა' : 'Note'}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">{language === 'ka' ? 'მოქმ.' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(viewMode === 'suppliers' ? filteredPayments : filteredCustomerPayments)
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((pay: any, i: number) => (
                        <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{pay.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{pay.supplier || pay.customer}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(pay.amount)}</td>
                          <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{pay.note || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => openEditPayment(pay)} className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setItemToDelete(pay.id)} className="text-red-500 hover:text-red-700 p-1 rounded transition-colors">
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
                        {formatCurrency((viewMode === 'suppliers' ? filteredPayments : filteredCustomerPayments).reduce((sum: number, p: any) => sum + p.amount, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{language === 'ka' ? (viewMode === 'suppliers' ? 'მომწოდებელი' : 'კომპანია') : (viewMode === 'suppliers' ? 'Supplier' : 'Customer')}</label>
                  <select
                    value={editPaymentForm.supplier}
                    onChange={(e) => setEditPaymentForm(p => ({ ...p, supplier: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                  >
                    <option value="">{language === 'ka' ? 'აირჩიეთ...' : 'Select...'}</option>
                    {(viewMode === 'suppliers' ? allSuppliers : allCustomers).map(s => <option key={s} value={s}>{s}</option>)}
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