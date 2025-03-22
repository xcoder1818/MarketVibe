import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, BarChart2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
          <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="https://6966465.fs1.hubspotusercontent-na1.net/hubfs/6966465/logos/Marketing%20Tui%202025/Blue%20logo%20horizontal.svg" 
                  alt="Logo" 
                  className="h-8 w-auto" 
                />
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {user && (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user.avatar_url ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
                
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.role && (
                        <p className="text-xs text-blue-600 mt-1">
                          Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User size={16} className="mr-2" />
                      Profile Settings
                    </Link>
                    <Link
                      to="/settings/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings size={16} className="mr-2" />
                      Notifications
                    </Link>
                    <Link
                      to="/settings/calendar"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Clock size={16} className="mr-2" />
                      Calendar Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;