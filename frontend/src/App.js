import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Branches from './pages/Branches';
import Sales from './pages/Sales';
import Items from './pages/Items';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import RedirectByRole from './components/RedirectByRole';
import BranchInventoryView from './pages/BranchInventoryView';
import BranchSalesPOS from './pages/BranchSalesPOS/BranchSalesPOS';
import StockManagement from './pages/StockManagement';
import LowStock from './pages/LowStock';
import TrendingStock from './pages/TrendingStock'; // ✅ Import new page

const Layout = ({ children }) => {
  const location = useLocation();
  const hideSidebar = location.pathname === '/login';

  return (
    <div className="flex">
      {!hideSidebar && <Sidebar />}
      <div
        className={`flex-1 bg-gray-100 min-h-screen p-4 ${
          !hideSidebar ? 'md:ml-64' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/stock" element={<StockManagement />} />

          {/* Admin-only routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requiredRole="admin">
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/low-stock" element={<LowStock />} />
          <Route
            path="/items"
            element={
              <PrivateRoute requiredRole="admin">
                <Items />
              </PrivateRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <PrivateRoute requiredRole="admin">
                <Branches />
              </PrivateRoute>
            }
          />
          <Route
            path="/trending-stock"
            element={
              <PrivateRoute requiredRole="admin">
                <TrendingStock />
              </PrivateRoute>
            }
          />

          {/* Shared routes (admin and branch) */}
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            }
          />
          <Route path="/inventory-view" element={<BranchInventoryView />} />
          <Route
            path="/branch-pos"
            element={
              <PrivateRoute>
                <BranchSalesPOS />
              </PrivateRoute>
            }
          />

          {/* Redirect base path */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RedirectByRole />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
