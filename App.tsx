import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { InventoryPage } from './pages/InventoryPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { AiAnalyticsPage } from './pages/AiAnalyticsPage';
import { DebtorPage } from './pages/DebtorPage';
import { BreakfastPage } from './pages/BreakfastPage';
import { HousekeepingPage } from './pages/HousekeepingPage';
import { TechnicalPage } from './pages/TechnicalPage';
import { InventoryArchivePage } from './pages/InventoryArchivePage';
import { GlobalInventoryPage } from './pages/GlobalInventoryPage';
import { t } from './i18n';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const FirstLoginScreen: React.FC = () => {
  const { language, changePassword, getCurrentUser } = useAppStore();
  const user = getCurrentUser();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError(t(language, 'passwordMismatch')); return; }
    if (newPassword.length < 4) { setError(language === 'ka' ? 'პაროლი უნდა შეიცავდეს მინიმუმ 4 სიმბოლოს.' : 'Password must be at least 4 characters long.'); return; }
    changePassword(newPassword);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t(language, 'firstLoginWelcome')}</h1>
          <p className="text-slate-500 font-medium">{t(language, 'firstLoginDesc')}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t(language, 'newPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="w-5 h-5 text-slate-400" /></div>
                <input type="password" required autoFocus value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white" placeholder="••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t(language, 'confirmPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="w-5 h-5 text-slate-400" /></div>
                <input type="password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white" placeholder="••••••" />
              </div>
              {error && (<div className="flex items-center mt-3 text-red-600 text-sm font-medium"><AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />{error}</div>)}
            </div>
            <button type="submit" className="w-full flex justify-center items-center px-4 py-3.5 bg-brand-600 text-white rounded-xl text-base font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
              {t(language, 'setNewPasswordBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, getCurrentUser, currentUserId } = useAppStore();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  const user = getCurrentUser();
  if (!user || user.id !== restaurantId) {
    return <Navigate to="/login" replace />;
  }

  if (user.isFirstLogin) return <FirstLoginScreen />;
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const isValidId = restaurantId && (/^(\d{9}|\d{11})$/.test(restaurantId) || restaurantId === '0000000');
  if (!isValidId) return <Navigate to="/HORECA/COSTCONTROL/0000000/dashboard" replace />;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative"><Outlet /></main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/HORECA/COSTCONTROL/:restaurantId" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Department Routes */}
        <Route path=":department/products" element={<ProductsPage />} />
        <Route path=":department/purchases" element={<PurchasesPage />} />
        <Route path=":department/menu" element={<MenuPage />} />
        <Route path=":department/sales" element={<SalesPage />} />
        <Route path=":department/inventory" element={<InventoryPage />} />

        {/* Legacy Routes (Redirect to restaurant) */}
        <Route path="products" element={<Navigate to="restaurant/products" replace />} />
        <Route path="purchases" element={<Navigate to="restaurant/purchases" replace />} />
        <Route path="menu" element={<Navigate to="restaurant/menu" replace />} />
        <Route path="sales" element={<Navigate to="restaurant/sales" replace />} />
        <Route path="inventory" element={<Navigate to="restaurant/inventory" replace />} />

        <Route path="settings" element={<SettingsPage />} />
        <Route path="instructions" element={<InstructionsPage />} />
        <Route path="ai-analytics" element={<AiAnalyticsPage />} />
        <Route path="debtor" element={<DebtorPage />} />
        <Route path="inventory-archive" element={<InventoryArchivePage />} />
        <Route path="global-inventory" element={<GlobalInventoryPage />} />
        <Route path="breakfast" element={<BreakfastPage />} />
        <Route path="housekeeping" element={<HousekeepingPage />} />
        <Route path="technical" element={<TechnicalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/HORECA/COSTCONTROL/0000000/dashboard" replace />} />
    </Routes>
  );
};

export default App;