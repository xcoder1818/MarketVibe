import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Activity,
  Settings,
  Shield,
  Building,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import CompanySelector from './CompanySelector';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentCompanyId, hasPermission } = useAuthStore();
  
  const isAdmin = currentCompanyId ? hasPermission(currentCompanyId, 'admin') : false;
  
  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Marketing Plans',
      icon: FileText,
      path: '/plans'
    },
    {
      name: 'Activities',
      icon: Activity,
      path: '/activities'
    },
    {
      name: 'Ideas',
      icon: Lightbulb,
      path: '/ideas'
    },
    {
      name: 'Messages',
      icon: MessageSquare,
      path: '/messages'
    },
  ];

  if (isAdmin) {
    menuItems.push(
      {
        name: 'Admin',
        icon: Shield,
        path: '/admin'
      },
      {
        name: 'All Companies',
        icon: Building,
        path: '/admin/companies'
      }
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-16">
      {/* Company Selector */}
      <div className="px-4 py-4 border-b border-gray-200">
        <CompanySelector />
      </div>

      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;