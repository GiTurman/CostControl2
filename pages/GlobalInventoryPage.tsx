import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Download, Boxes, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export const GlobalInventoryPage: React.FC = () => {
  const { language, getProducts, getPurchases, getSales, getDishes, getInventoryAudits, getDirectConsumptions } = useAppStore();
  const products = getProducts();
  const purchases = getPurchases();
  const sales = getSales();
  const dishes = getDishes();
  const inventoryAudits = getInventoryAudits();
  const directConsumptions = getDirectConsumptions();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const formatUnit = (unit: string) => {
    const translated = t(language, `unit_${unit}`);
    return translated === `unit_${unit}` ? unit : translated;
  };

  const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
    const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
    return netQuantity / (1 - (validLoss / 100));
  };

  const inventoryData = useMemo(() => {
    return products.map((prod: any) => {
      const currentDept = prod.department || 'restaurant';
      
      // 1. Find the most recent audit strictly BEFORE the selected date for this product's department
      const prevAudits = inventoryAudits
        .filter((a: any) => a.date < selectedDate && (a.department || 'restaurant') === currentDept)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastAudit = prevAudits.length > 0 ? prevAudits[0] : null;
      const lastAuditDate = lastAudit ? lastAudit.date : null;

      // 2. Filter records only within the current "period"
      const windowPurchases = purchases.filter((p: any) => {
        if (p.productId !== prod.id) return false;
        if (p.date > selectedDate) return false;
        if (lastAuditDate && p.date <= lastAuditDate) return false;
        return true;
      });

      const windowSales = sales.filter((s: any) => {
        if ((s.department || 'restaurant') !== currentDept) return false;
        if (s.date > selectedDate) return false;
        if (lastAuditDate && s.date <= lastAuditDate) return false;
        return true;
      });

      // 3. Sum purchases
      const purchased = windowPurchases.reduce((sum: number, p: any) => sum + p.quantity, 0);

      // 4. Sum consumption
      let consumed = 0;
      windowSales.forEach((s: any) => {
        const dish = dishes.find((d: any) => d.id === s.dishId);
        if (dish) {
          const ingredient = dish.ingredients.find((ing: any) => ing.productId === prod.id);
          if (ingredient) {
            const grossQty = getGrossQuantity(ingredient.quantity, ingredient.lossPercentage || 0);
            consumed += grossQty * s.quantity;
          }
        }
      });

      // 4b. Direct consumptions
      const windowDirect = (directConsumptions || []).filter((dc: any) => {
        if (dc.productId !== prod.id) return false;
        if (dc.date > selectedDate) return false;
        if (lastAuditDate && dc.date <= lastAuditDate) return false;
        return true;
      });
      consumed += windowDirect.reduce((sum: number, dc: any) => sum + dc.quantity, 0);

      const startingBalance = lastAudit && lastAudit.balances[prod.id] !== undefined ? lastAudit.balances[prod.id] : 0;
      const expectedBalance = startingBalance + purchased - consumed;

      return {
        ...prod,
        startingBalance,
        purchased,
        consumed,
        expectedBalance,
        department: currentDept
      };
    });
  }, [products, purchases, sales, dishes, inventoryAudits, selectedDate, directConsumptions]);

  const filteredData = inventoryData.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || item.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleExport = () => {
    const dataToExport = filteredData.map((item: any) => ({
      [t(language, 'productName')]: item.name,
      [language === 'ka' ? 'დეპარტამენტი' : 'Department']: item.department,
      [t(language, 'category')]: item.category,
      [t(language, 'unit')]: formatUnit(item.unit),
      [language === 'ka' ? 'საწყისი' : 'Starting']: item.startingBalance.toFixed(3),
      [t(language, 'purchased')]: item.purchased.toFixed(3),
      [t(language, 'consumed')]: item.consumed.toFixed(3),
      [t(language, 'expectedBalance')]: item.expectedBalance.toFixed(3),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Global Inventory');
    XLSX.writeFile(workbook, `Global_Inventory_${selectedDate}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="text-brand-600" />
            {language === 'ka' ? 'საერთო ინვენტარი' : 'Global Inventory'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'ka' ? 'ყველა დეპარტამენტის ნაშთების კონსოლიდირებული ხედვა' : 'Consolidated view of balances across all departments'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t(language, 'search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-sm border-none focus:ring-0 bg-transparent p-0 font-medium"
            >
              <option value="all">{language === 'ka' ? 'ყველა დეპარტამენტი' : 'All Departments'}</option>
              <option value="restaurant">{language === 'ka' ? 'რესტორანი' : 'Restaurant'}</option>
              <option value="bar">{language === 'ka' ? 'ბარი' : 'Bar'}</option>
              <option value="breakfast">{language === 'ka' ? 'საუზმე' : 'Breakfast'}</option>
              <option value="housekeeping">{language === 'ka' ? 'ჰაუს ქიფინგი' : 'Housekeeping'}</option>
            </select>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
          />
          
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'productName')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'ka' ? 'დეპარტამენტი' : 'Dept'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'category')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'ka' ? 'საწყისი' : 'Start'}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'purchased')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'consumed')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'expectedBalance')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'unit')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                    {t(language, 'noProducts')}
                  </td>
                </tr>
              ) : (
                filteredData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.department === 'restaurant' ? 'bg-blue-100 text-blue-700' :
                        item.department === 'bar' ? 'bg-purple-100 text-purple-700' :
                        item.department === 'breakfast' ? 'bg-amber-100 text-amber-700' :
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {item.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-400">
                      {item.startingBalance.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-blue-600 font-bold">
                      +{item.purchased.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-red-600 font-bold">
                      -{item.consumed.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-mono font-black ${item.expectedBalance < item.minBalance ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.expectedBalance.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-gray-400 uppercase">
                      {formatUnit(item.unit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
