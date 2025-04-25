import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Users, Calendar, PieChart, UserPlus, LogOut, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddMember from './pages/AddMember';
import Attendance from './pages/Attendance';
import Insights from './pages/Insights';
import Login from './pages/Login';

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    window.location.href = '/login';
  };

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="h-5 w-5 mr-3" />
        {children}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="h-full bg-white border-r border-gray-200 w-64 space-y-6 py-4 px-2">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-semibold">TACNW</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden text-gray-500 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="space-y-1 px-2">
        <NavLink to="/" icon={PieChart}>Dashboard</NavLink>
        <NavLink to="/add-member" icon={UserPlus}>Add Member</NavLink>
        <NavLink to="/attendance" icon={Calendar}>Attendance</NavLink>
        <NavLink to="/insights" icon={PieChart}>Insights</NavLink>
      </nav>
      <div className="px-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {location.pathname !== '/login' && (
        <>
          {/* Mobile menu button */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold"> TACNW</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile sidebar */}
          <div
            className={`fixed inset-0 z-40 lg:hidden ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white">
              <Sidebar />
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <Sidebar />
          </div>
        </>
      )}

      <div className={`${location.pathname !== '/login' ? 'lg:pl-64' : ''}`}>
        <main className={`${location.pathname !== '/login' ? 'pt-16 lg:pt-0' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/add-member" element={<AddMember />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/insights" element={<Insights />} />
                    </Routes>
                  </div>
                </RequireAuth>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;