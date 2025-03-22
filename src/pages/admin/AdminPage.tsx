import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield, Users, Building, Plus, Edit, Trash2, UserPlus, Mail, X, Check, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Company, User, UserPermission } from '../../types';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    companies, 
    currentCompanyId, 
    hasPermission, 
    fetchCompanies 
  } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'permissions'>('companies');
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [isManageCompanyUsersModalOpen, setIsManageCompanyUsersModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Mock data for users and permissions
  const [users, setUsers] = useState<User[]>([
    { 
      id: '1', 
      email: 'admin@example.com', 
      full_name: 'Admin User',
      role: 'admin',
      company_id: '1'
    },
    { 
      id: '2', 
      email: 'manager@example.com', 
      full_name: 'Manager User',
      role: 'manager',
      company_id: '1'
    },
    { 
      id: '3', 
      email: 'client@example.com', 
      full_name: 'Client User',
      role: 'client',
      company_id: '2'
    },
    { 
      id: '4', 
      email: 'viewer@example.com', 
      full_name: 'Viewer User',
      role: 'viewer',
      company_id: '2'
    }
  ]);
  
  const [permissions, setPermissions] = useState<UserPermission[]>([
    {
      id: 'p1',
      user_id: '1',
      company_id: '1',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p2',
      user_id: '2',
      company_id: '1',
      role: 'manager',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p3',
      user_id: '3',
      company_id: '2',
      role: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p4',
      user_id: '4',
      company_id: '2',
      role: 'viewer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    logo_url: ''
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer' as 'admin' | 'manager' | 'client' | 'viewer',
    company_id: ''
  });

  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{
    userId: string;
    role: 'admin' | 'manager' | 'client' | 'viewer';
  }[]>([]);
  
  useEffect(() => {
    // Check if user is admin
    if (user && currentCompanyId) {
      const isAdmin = hasPermission(currentCompanyId, 'admin');
      if (!isAdmin) {
        // Redirect to dashboard if not admin
        navigate('/dashboard');
      }
    }
    
    fetchCompanies();
  }, [user, currentCompanyId, hasPermission, navigate, fetchCompanies]);
  
  const handleCreateCompany = () => {
    // Mock creating a company
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: companyForm.name,
      logo_url: companyForm.logo_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || ''
    };
    
    // Add to companies list
    setCompanyForm({ name: '', logo_url: '' });
    setIsCreateCompanyModalOpen(false);
  };
  
  const handleEditCompany = () => {
    if (!selectedCompany) return;
    
    // Mock updating a company
    const updatedCompany: Company = {
      ...selectedCompany,
      name: companyForm.name,
      logo_url: companyForm.logo_url,
      updated_at: new Date().toISOString()
    };
    
    // Update companies list
    setCompanyForm({ name: '', logo_url: '' });
    setSelectedCompany(null);
    setIsEditCompanyModalOpen(false);
  };
  
  const handleDeleteCompany = (companyId: string) => {
    // Mock deleting a company
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      // Delete company logic
    }
  };
  
  const handleInviteUser = () => {
    // Mock inviting a user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: inviteForm.email,
      full_name: '',
      role: inviteForm.role,
      company_id: inviteForm.company_id
    };
    
    const newPermission: UserPermission = {
      id: `perm-${Date.now()}`,
      user_id: newUser.id,
      company_id: inviteForm.company_id,
      role: inviteForm.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setUsers([...users, newUser]);
    setPermissions([...permissions, newPermission]);
    setInviteForm({ email: '', role: 'viewer', company_id: '' });
    setIsInviteUserModalOpen(false);
  };
  
  const handleUpdatePermission = (userId: string, companyId: string, role: 'admin' | 'manager' | 'client' | 'viewer') => {
    // Mock updating a permission
    setPermissions(permissions.map(p => 
      p.user_id === userId && p.company_id === companyId
        ? { ...p, role, updated_at: new Date().toISOString() }
        : p
    ));
  };
  
  const handleRemovePermission = (userId: string, companyId: string) => {
    // Mock removing a permission
    if (window.confirm('Are you sure you want to remove this user\'s access to the company?')) {
      setPermissions(permissions.filter(p => 
        !(p.user_id === userId && p.company_id === companyId)
      ));
    }
  };

  const handleOpenManageCompanyUsers = (company: Company) => {
    setSelectedCompany(company);
    
    // Get existing users for this company
    const companyPermissions = permissions.filter(p => p.company_id === company.id);
    setSelectedUsers(companyPermissions.map(p => ({
      userId: p.user_id,
      role: p.role as 'admin' | 'manager' | 'client' | 'viewer'
    })));
    
    setIsManageCompanyUsersModalOpen(true);
  };

  const handleAddUserToCompany = (userId: string, role: 'admin' | 'manager' | 'client' | 'viewer') => {
    // Check if user is already selected
    if (selectedUsers.some(u => u.userId === userId)) {
      return;
    }
    
    setSelectedUsers([...selectedUsers, { userId, role }]);
  };

  const handleRemoveUserFromCompany = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'manager' | 'client' | 'viewer') => {
    setSelectedUsers(selectedUsers.map(u => 
      u.userId === userId ? { ...u, role } : u
    ));
  };

  const handleSaveCompanyUsers = () => {
    if (!selectedCompany) return;
    
    // Remove all existing permissions for this company
    const updatedPermissions = permissions.filter(p => p.company_id !== selectedCompany.id);
    
    // Add new permissions based on selectedUsers
    const newPermissions = selectedUsers.map(u => ({
      id: `perm-${Date.now()}-${u.userId}`,
      user_id: u.userId,
      company_id: selectedCompany.id,
      role: u.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    setPermissions([...updatedPermissions, ...newPermissions]);
    setIsManageCompanyUsersModalOpen(false);
    setSelectedCompany(null);
    setSelectedUsers([]);
  };

  // Filter users for the company users modal
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchUserTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage companies, users, and permissions
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('companies')}
            >
              <Building className="inline-block mr-2 h-5 w-5" />
              Companies
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="inline-block mr-2 h-5 w-5" />
              Users
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              <Shield className="inline-block mr-2 h-5 w-5" />
              Permissions
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Companies</h2>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsCreateCompanyModalOpen(true)}
                >
                  Add Company
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companies.map(company => {
                      // Count users with permissions for this company
                      const companyUsers = permissions.filter(p => p.company_id === company.id);
                      
                      return (
                        <tr key={company.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {company.logo_url ? (
                                <img className="h-10 w-10 rounded-full" src={company.logo_url} alt={company.name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Building className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {users.find(u => u.id === company.owner_id)?.full_name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(company.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                {companyUsers.length} users
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2"
                                onClick={() => handleOpenManageCompanyUsers(company)}
                              >
                                <Users size={14} className="mr-1" />
                                Manage
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              onClick={() => {
                                setSelectedCompany(company);
                                setCompanyForm({
                                  name: company.name,
                                  logo_url: company.logo_url || ''
                                });
                                setIsEditCompanyModalOpen(true);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Users</h2>
                <Button
                  variant="primary"
                  leftIcon={<UserPlus size={16} />}
                  onClick={() => setIsInviteUserModalOpen(true)}
                >
                  Invite User
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt={user.full_name} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unnamed User'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                              user.role === 'client' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {companies.find(c => c.id === user.company_id)?.name || 'No Company'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">User Permissions</h2>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsInviteUserModalOpen(true)}
                >
                  Add Permission
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissions.map(permission => {
                      const user = users.find(u => u.id === permission.user_id);
                      const company = companies.find(c => c.id === permission.company_id);
                      
                      return (
                        <tr key={permission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user?.full_name || 'Unnamed User'}</div>
                                <div className="text-xs text-gray-500">{user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company?.name || 'Unknown Company'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              value={permission.role}
                              onChange={(e) => handleUpdatePermission(
                                permission.user_id, 
                                permission.company_id, 
                                e.target.value as any
                              )}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="client">Client</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemovePermission(permission.user_id, permission.company_id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Company Modal */}
      <Modal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        title="Add New Company"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateCompany(); }} className="space-y-4">
          <Input
            label="Company Name"
            name="name"
            type="text"
            placeholder="Acme Inc."
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
            fullWidth
          />
          
          <Input
            label="Logo URL (optional)"
            name="logo_url"
            type="text"
            placeholder="https://example.com/logo.png"
            value={companyForm.logo_url}
            onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
            fullWidth
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsCreateCompanyModalOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="primary"
            >
              Create Company
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditCompanyModalOpen}
        onClose={() => setIsEditCompanyModalOpen(false)}
        title="Edit Company"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditCompany(); }} className="space-y-4">
          <Input
            label="Company Name"
            name="name"
            type="text"
            placeholder="Acme Inc."
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
            fullWidth
          />
          
          <Input
            label="Logo URL (optional)"
            name="logo_url"
            type="text"
            placeholder="https://example.com/logo.png"
            value={companyForm.logo_url}
            onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
            fullWidth
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsEditCompanyModalOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="primary"
            >
              Update Company
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteUserModalOpen}
        onClose={() => setIsInviteUserModalOpen(false)}
        title="Invite User"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleInviteUser(); }} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="user@example.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            required
            fullWidth
            leftIcon={<Mail size={18} className="text-gray-400" />}
          />
          
          <div className="w-full">
            <label 
              htmlFor="role" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
              required
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="client">Client</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div className="w-full">
            <label 
              htmlFor="company_id" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company
            </label>
            <select
              id="company_id"
              name="company_id"
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={inviteForm.company_id}
              onChange={(e) => setInviteForm({ ...inviteForm, company_id: e.target.value })}
              required
            >
              <option value="">Select a company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsInviteUserModalOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="primary"
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Company Users Modal */}
      <Modal
        isOpen={isManageCompanyUsersModalOpen}
        onClose={() => setIsManageCompanyUsersModalOpen(false)}
        title={`Manage Users for ${selectedCompany?.name || 'Company'}`}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Current Users</h3>
            {selectedUsers.length > 0 ? (
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                {selectedUsers.map(selectedUser => {
                  const user = users.find(u => u.id === selectedUser.userId);
                  return (
                    <div key={selectedUser.userId} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user?.full_name || 'Unnamed User'}</div>
                          <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          className="block pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                          value={selectedUser.role}
                          onChange={(e) => handleUpdateUserRole(
                            selectedUser.userId, 
                            e.target.value as any
                          )}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="client">Client</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          className="text-red-600 hover:text-red-900 p-1"
                          onClick={() => handleRemoveUserFromCompany(selectedUser.userId)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">No users have been added to this company yet.</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Users</h3>
            <div className="mb-4">
              <Input
                placeholder="Search users by name or email..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                fullWidth
                leftIcon={<Search size={18} className="text-gray-400" />}
              />
            </div>
            <div className="bg-gray-50 rounded-md p-4 max-h-60 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map(user => {
                    // Check if user is already selected
                    const isSelected = selectedUsers.some(u => u.userId === user.id);
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unnamed User'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check size={12} className="mr-1" />
                            Added
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <select
                              className="block pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                              defaultValue="viewer"
                              id={`role-${user.id}`}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="client">Client</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const selectElement = document.getElementById(`role-${user.id}`) as HTMLSelectElement;
                                handleAddUserToCompany(user.id, selectElement.value as any);
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No users found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsManageCompanyUsersModalOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              type="button" 
              variant="primary"
              onClick={handleSaveCompanyUsers}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;