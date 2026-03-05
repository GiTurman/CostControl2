import React, { useState } from 'react';
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { 
  LayoutDashboard, Utensils, TrendingUp, ShoppingCart, Package, Boxes, X, Trash2,
  Settings, BookOpen, LineChart, LogOut, Landmark, ChevronDown, ChevronRight,
  UtensilsCrossed, Sparkles, Coffee, Home, Wine, ClipboardList
} from 'lucide-react';

interface SidebarProps { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { language, clearAllData, logout } = useAppStore();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [confirmModal, setConfirmModal] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [restaurantExpanded, setRestaurantExpanded] = useState(false);
  const [barExpanded, setBarExpanded] = useState(false);
  const [breakfastExpanded, setBreakfastExpanded] = useState(false);
  const [housekeepingExpanded, setHousekeepingExpanded] = useState(false);
  const [debtorExpanded, setDebtorExpanded] = useState(false);

  const basePath = `/HORECA/COSTCONTROL/${restaurantId}`;
  const currentTab = searchParams.get('tab');
  const currentPath = window.location.pathname;
  const isOnDebtor = currentPath.includes('/debtor');

  const getSubItems = (dept: string) => {
    if (dept === 'restaurant' || dept === 'bar' || dept === 'breakfast') {
      return [
        { path: `${basePath}/${dept}/menu`, label: t(language, 'menu'), icon: Utensils },
        { path: `${basePath}/${dept}/sales`, label: t(language, 'sales'), icon: TrendingUp },
        { path: `${basePath}/${dept}/purchases`, label: t(language, 'purchases'), icon: ShoppingCart },
        { path: `${basePath}/${dept}/inventory`, label: t(language, 'inventory'), icon: Package },
      ];
    }
    if (dept === 'housekeeping') {
      return [
        { path: `${basePath}/${dept}/purchases`, label: t(language, 'purchases'), icon: ShoppingCart },
        { path: `${basePath}/${dept}`, label: language === 'ka' ? 'ხარჯვა' : 'Consumption', icon: TrendingUp },
        { path: `${basePath}/${dept}/inventory`, label: t(language, 'inventory'), icon: Package },
      ];
    }
    return [];
  };

  const isDeptActive = (dept: string) => currentPath.includes(`/${dept}/`) || (dept === 'breakfast' && currentPath.endsWith('/breakfast')) || (dept === 'housekeeping' && currentPath.endsWith('/housekeeping'));

  const bottomNavItems = [
    { path: `${basePath}/settings`, label: language === 'ka' ? 'პარამეტრები' : 'Settings', icon: Settings },
    { path: `${basePath}/instructions`, label: language === 'ka' ? 'ინსტრუქცია' : 'Guide', icon: BookOpen },
  ];

  const handleClearData = () => {
    setConfirmModal({ message: 'WARNING: Are you sure you want to completely Reset for Production? This will permanently wipe ALL DATA from the system.',
      onConfirm: () => { clearAllData(); setAlertMessage('System successfully reset for production use. Reloading...'); setTimeout(() => window.location.reload(), 1500); }
    });
  };

  const handleLogout = () => { logout(); setIsOpen(false); navigate('/login', { replace: true }); };
  const navigateDebtor = (tab: string) => { navigate(`${basePath}/debtor?tab=${tab}`); setIsOpen(false); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <h1 className="text-white font-bold text-lg truncate">{t(language, 'appTitle')}</h1>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <NavLink to={`${basePath}/dashboard`} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <LayoutDashboard className="w-5 h-5 mr-3" />{t(language, 'dashboard')}
              </NavLink>
            </li>

            {/* რესტორანი (Dropdown) */}
            <li>
              <button onClick={() => setRestaurantExpanded(!restaurantExpanded)} className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${isDeptActive('restaurant') && !restaurantExpanded ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center"><UtensilsCrossed className="w-5 h-5 mr-3" />{language === 'ka' ? 'რესტორანი' : 'Restaurant'}</div>
                {restaurantExpanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
              {restaurantExpanded && (
                <ul className="ml-6 border-l border-slate-700 space-y-0.5">
                  {getSubItems('restaurant').map(item => { const Icon = item.icon; return (
                    <li key={item.path}><NavLink to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                      <Icon className="w-4 h-4 mr-2.5" />{item.label}
                    </NavLink></li>
                  );})}
                </ul>
              )}
            </li>

            {/* ბარი (Dropdown) */}
            <li>
              <button onClick={() => setBarExpanded(!barExpanded)} className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${isDeptActive('bar') && !barExpanded ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center"><Wine className="w-5 h-5 mr-3" />{language === 'ka' ? 'ბარი' : 'Bar'}</div>
                {barExpanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
              {barExpanded && (
                <ul className="ml-6 border-l border-slate-700 space-y-0.5">
                  {getSubItems('bar').map(item => { const Icon = item.icon; return (
                    <li key={item.path}><NavLink to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                      <Icon className="w-4 h-4 mr-2.5" />{item.label}
                    </NavLink></li>
                  );})}
                </ul>
              )}
            </li>

            {/* საუზმე (Dropdown) */}
            <li>
              <button onClick={() => setBreakfastExpanded(!breakfastExpanded)} className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${isDeptActive('breakfast') && !breakfastExpanded ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center"><Coffee className="w-5 h-5 mr-3" />{language === 'ka' ? 'საუზმე' : 'Breakfast'}</div>
                {breakfastExpanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
              {breakfastExpanded && (
                <ul className="ml-6 border-l border-slate-700 space-y-0.5">
                  {getSubItems('breakfast').map(item => { const Icon = item.icon; return (
                    <li key={item.path}><NavLink to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                      <Icon className="w-4 h-4 mr-2.5" />{item.label}
                    </NavLink></li>
                  );})}
                </ul>
              )}
            </li>

            {/* ჰაუს ქიფინგი (Dropdown) */}
            <li>
              <button onClick={() => setHousekeepingExpanded(!housekeepingExpanded)} className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${isDeptActive('housekeeping') && !housekeepingExpanded ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center"><Sparkles className="w-5 h-5 mr-3" />{language === 'ka' ? 'ჰაუს ქიფინგი' : 'Housekeeping'}</div>
                {housekeepingExpanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
              {housekeepingExpanded && (
                <ul className="ml-6 border-l border-slate-700 space-y-0.5">
                  {getSubItems('housekeeping').map(item => { const Icon = item.icon; return (
                    <li key={item.path}><NavLink to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                      <Icon className="w-4 h-4 mr-2.5" />{item.label}
                    </NavLink></li>
                  );})}
                </ul>
              )}
            </li>

            {/* დებიტორი */}
            <li>
              <button onClick={() => setDebtorExpanded(!debtorExpanded)} className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${isOnDebtor && !debtorExpanded ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center"><Landmark className="w-5 h-5 mr-3" />{language === 'ka' ? 'დებიტორი' : 'Debtors'}</div>
                {debtorExpanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>
              {debtorExpanded && (
                <ul className="ml-6 border-l border-slate-700 space-y-0.5">
                  <li><button onClick={() => navigateDebtor('debts')} className={`w-full text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isOnDebtor && (currentTab === 'debts' || !currentTab) ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>{language === 'ka' ? 'დავალიანება' : 'Debts'}</button></li>
                  <li><button onClick={() => navigateDebtor('payments')} className={`w-full text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-colors ${isOnDebtor && currentTab === 'payments' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>{language === 'ka' ? 'გადახდა' : 'Payments'}</button></li>
                </ul>
              )}
            </li>

            {/* AI */}
            <li>
              <NavLink to={`${basePath}/ai-analytics`} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <LineChart className="w-5 h-5 mr-3" />{t(language, 'aiInsights')}
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="mt-auto pb-2">
          <ul className="space-y-1">
            {bottomNavItems.map(item => { const Icon = item.icon; return (
              <li key={item.path}><NavLink to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Icon className="w-5 h-5 mr-3" />{item.label}
              </NavLink></li>
            );})}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
            <LogOut className="w-4 h-4 mr-2" />{t(language, 'logout')}
          </button>
          <button onClick={handleClearData} className="w-full flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20 mt-2">
            <Trash2 className="w-4 h-4 mr-2" />Reset for Production
          </button>
          <div className="text-xs text-slate-500 text-center mt-2">ID: {restaurantId}</div>
        </div>
      </aside>

      {/* MODALS REMAIN UNCHANGED */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ყურადღება / Warning</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </>
  );
};