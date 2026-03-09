import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { Archive, Calendar, Printer, Trash2, ChevronRight, ChevronDown, Boxes, FileText, Search } from 'lucide-react';
import { Department } from '../types';

export const InventoryArchivePage: React.FC = () => {
  const { language, getInventoryAudits, getProducts, deleteInventoryAudit } = useAppStore();
  const audits = getInventoryAudits();
  const products = getProducts();
  
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const sortedAudits = useMemo(() => {
    return [...audits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [audits]);

  const filteredAudits = useMemo(() => {
    return sortedAudits.filter(a => {
      const matchesDept = deptFilter === 'all' || (a.department || 'restaurant') === deptFilter;
      const matchesSearch = a.date.includes(searchTerm);
      return matchesDept && matchesSearch;
    });
  }, [sortedAudits, deptFilter, searchTerm]);

  const handlePrint = (auditId: string) => {
    setExpandedAuditId(auditId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
  const getProductUnit = (id: string) => products.find(p => p.id === id)?.unit || '';

  const formatUnit = (unit: string) => {
    const translated = t(language, `unit_${unit}`);
    return translated === `unit_${unit}` ? unit : translated;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 pb-20 print:p-0 print:max-w-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 p-3 rounded-xl shadow-lg">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{language === 'ka' ? 'ინვენტარიზაციის არქივი' : 'Inventory Archive'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{language === 'ka' ? 'შენახული ინვენტარიზაციის ისტორია და დეტალები' : 'History and details of saved inventory audits'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'ka' ? 'ძიება თარიღით...' : 'Search by date...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500 outline-none shadow-sm"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-slate-500 outline-none shadow-sm"
        >
          <option value="all">{language === 'ka' ? 'ყველა დეპარტამენტი' : 'All Departments'}</option>
          <option value="restaurant">{language === 'ka' ? 'რესტორანი / საუზმე' : 'Restaurant / Breakfast'}</option>
          <option value="bar">{language === 'ka' ? 'ბარი' : 'Bar'}</option>
          <option value="housekeeping">{language === 'ka' ? 'ჰაუს ქიფინგი' : 'Housekeeping'}</option>
          <option value="technical">{language === 'ka' ? 'ტექნიკური' : 'Technical'}</option>
        </select>
      </div>

      {/* Audit List */}
      <div className="space-y-4">
        {filteredAudits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm print:hidden">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">{language === 'ka' ? 'არქივი ცარიელია' : 'Archive is empty'}</h3>
            <p className="text-sm text-gray-500 mt-1">{language === 'ka' ? 'შენახული ინვენტარიზაციები აქ გამოჩნდება' : 'Saved inventory audits will appear here'}</p>
          </div>
        ) : (
          filteredAudits.map((audit) => {
            const isExpanded = expandedAuditId === audit.id;
            const itemCount = Object.keys(audit.balances).length;
            const dept = audit.department || 'restaurant';

            return (
              <div 
                key={audit.id} 
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-slate-800 shadow-md border-transparent' : 'border-gray-200 shadow-sm hover:border-gray-300'} print:border-0 print:ring-0 print:shadow-none print:mb-10`}
              >
                {/* Audit Header */}
                <div 
                  onClick={() => setExpandedAuditId(isExpanded ? null : audit.id)}
                  className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none ${isExpanded ? 'bg-slate-50' : 'bg-white'} print:bg-white print:border-b-2 print:border-slate-900 print:mb-4`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      dept === 'restaurant' ? 'bg-blue-100 text-blue-700' :
                      dept === 'bar' ? 'bg-purple-100 text-purple-700' :
                      dept === 'breakfast' ? 'bg-amber-100 text-amber-700' :
                      dept === 'technical' ? 'bg-blue-100 text-blue-700' :
                      'bg-teal-100 text-teal-700'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">{audit.date}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          dept === 'restaurant' ? 'bg-blue-100 text-blue-700' :
                          dept === 'bar' ? 'bg-purple-100 text-purple-700' :
                          dept === 'breakfast' ? 'bg-amber-100 text-amber-700' :
                          dept === 'technical' ? 'bg-blue-100 text-blue-700' :
                          'bg-teal-100 text-teal-700'
                        }`}>
                          {dept}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{itemCount} {language === 'ka' ? 'პროდუქტი' : 'products'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(audit.id); }}
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                      title={language === 'ka' ? 'ბეჭდვა' : 'Print'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (confirm(language === 'ka' ? 'ნამდვილად გსურთ წაშლა?' : 'Are you sure you want to delete?')) {
                          deleteInventoryAudit(audit.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={language === 'ka' ? 'წაშლა' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="ml-2 text-slate-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Audit Details */}
                {isExpanded && (
                  <div className="p-0 sm:p-6 bg-white overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-slate-50 print:bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-slate-600 border-b border-slate-200">{language === 'ka' ? 'პროდუქტი' : 'Product'}</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-600 border-b border-slate-200">{language === 'ka' ? 'ერთეული' : 'Unit'}</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-900 border-b border-slate-200">{language === 'ka' ? 'ფაქტიური ნაშთი' : 'Actual Balance'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(audit.balances).map(([productId, balance]) => (
                          <tr key={productId} className="hover:bg-slate-50 print:hover:bg-transparent">
                            <td className="px-4 py-3 font-medium text-slate-900">{getProductName(productId)}</td>
                            <td className="px-4 py-3 text-center text-slate-500">{formatUnit(getProductUnit(productId))}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">{Number(balance).toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="hidden print:block mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                      HORECA Cost Control System - Inventory Audit Report - {audit.date}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Print-only Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 p-4 text-center text-[10px] text-slate-400">
        Generated on {new Date().toLocaleString()} - HORECA Cost Control System
      </div>
    </div>
  );
};
