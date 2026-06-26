import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBoxes,
  FaStore,
  FaMoneyBill,
  FaCubes,
  FaSignOutAlt,
  FaArrowCircleUp,
  FaChartLine,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import InstallAppButton from '../components/InstallAppButton';

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const linkClass =
    'flex items-center p-3 gap-2 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-all text-gray-700';
  const activeClass = 'bg-blue-100 font-semibold';

  return (
    <>
      {/* Desktop Sidebar */}

      <div className="hidden md:flex w-64 bg-white min-h-screen shadow-lg p-6 fixed flex-col z-40">

        <div className="flex justify-center mb-6">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto pr-2">
          {role === 'admin' && (
            <>
              <NavLink to="/" end className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                <FaTachometerAlt /> Dashboard
              </NavLink>

              <NavLink to="/inventory" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                <FaBoxes /> Inventory
              </NavLink>

              <NavLink to="/branches" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                <FaStore /> Branches
              </NavLink>

              <NavLink to="/items" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                <FaCubes /> Items
              </NavLink>

              <NavLink to="/sales" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                <FaMoneyBill /> Sales
              </NavLink>

              <NavLink
                to="/trending-stock"
                className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
              >
                <FaChartLine /> Trending Stock
              </NavLink>
            </>
          )}

          {role !== 'admin' && (
            <>
              <NavLink
                to="/inventory-view"
                className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
              >
                <FaBoxes /> Inventory
              </NavLink>

              <NavLink
                to="/branch-pos"
                className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
              >
                <FaMoneyBill /> Sales
              </NavLink>

              <NavLink
                to="/stock"
                className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
              >
                <FaArrowCircleUp /> Stock Out
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-5 mb-24">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-100 transition-all"
          >
            <FaSignOutAlt /> Logout
          </button>

          <div className="w-full">
            <InstallAppButton />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white shadow fixed top-0 left-0 right-0 z-[50]">
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-800 active:scale-90 transition-transform"
        >
          {open ? <FaTimes size={26} /> : <FaBars size={26} />}
        </button>

        <img src="/images/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[70] flex">

          {/* Blur Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Slide-in Drawer */}
          <div
            className="relative bg-white w-64 h-full p-5 flex flex-col rounded-r-2xl animate-slide-in shadow-2xl overflow-y-auto"
          >
            <nav className="flex flex-col gap-2 mt-4">
              {role === 'admin' && (
                <>
                  <NavLink to="/" end onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaTachometerAlt /> Dashboard
                  </NavLink>

                  <NavLink to="/inventory" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaBoxes /> Inventory
                  </NavLink>

                  <NavLink to="/branches" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaStore /> Branches
                  </NavLink>

                  <NavLink to="/items" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaCubes /> Items
                  </NavLink>

                  <NavLink to="/sales" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaMoneyBill /> Sales
                  </NavLink>

                  <NavLink to="/trending-stock" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaChartLine /> Trending Stock
                  </NavLink>
                </>
              )}

              {role !== 'admin' && (
                <>
                  <NavLink to="/inventory-view" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaBoxes /> Inventory
                  </NavLink>

                  <NavLink to="/branch-pos" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaMoneyBill /> Sales
                  </NavLink>

                  <NavLink to="/stock" onClick={() => setOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}>
                    <FaArrowCircleUp /> Stock Out
                  </NavLink>
                </>
              )}
            </nav>

            <div className="mt-auto flex flex-col gap-5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-100 transition-all"
              >
                <FaSignOutAlt /> Logout
              </button>

              {/* Install button flows inside sidebar for desktop */}
              <div className="w-full hidden md:block">
                <InstallAppButton className="relative fixed-none bottom-auto left-auto" />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
