import React, { useState, useEffect } from 'react';
import { getAllUsers, deactivateUser, reactivateUser, updateUserRole, getStaffMembers } from '../../services/api';
import { User } from '../../types';
import UserDetailsModal from './UserDetailsModal';
import './UserManagement.css';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, roleFilter, activeFilter]);

  const fetchUsers = async (searchTerm?: string) => {
    setLoading(true);
    try {
      // Special case for staff filter - use the dedicated staff endpoint
      if (roleFilter === 'staff') {
        const isActive = activeFilter ? activeFilter === 'active' : undefined;
        const response = await getStaffMembers(isActive);
        
        // Filter by search term if provided
        let staffUsers = response.staff;
        if (searchTerm || search) {
          const searchQuery = (searchTerm || search).toLowerCase();
          staffUsers = staffUsers.filter(user => 
            user.name.toLowerCase().includes(searchQuery) || 
            user.email.toLowerCase().includes(searchQuery)
          );
        }
        
        setUsers(staffUsers);
      } else {
        // Use regular getAllUsers for other filters
        const params: {
          role?: string;
          isActive?: boolean;
          search?: string;
        } = {};
        
        if (roleFilter) params.role = roleFilter;
        if (activeFilter) params.isActive = activeFilter === 'active';
        if (searchTerm || search) params.search = searchTerm || search;
        
        const response = await getAllUsers(params);
        setUsers(response.users);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setProcessingUser(user._id);
      setError(null);
      setSuccessMessage(null);
      
      if (user.isActive) {
        await deactivateUser(user._id);
        setSuccessMessage(`${user.name} has been deactivated successfully`);
      } else {
        await reactivateUser(user._id);
        setSuccessMessage(`${user.name} has been reactivated successfully`);
      }
      
      // Update the user in the local state
      setUsers(prevUsers => prevUsers.map(u => 
        u._id === user._id ? { ...u, isActive: !user.isActive } : u
      ));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || `Failed to ${user.isActive ? 'deactivate' : 'reactivate'} user`);
    } finally {
      setProcessingUser(null);
    }
  };
  
  const handleChangeRole = async (user: User, newRole: string) => {
    if (user.role === newRole) return; // No change needed
    
    try {
      setProcessingUser(user._id);
      setError(null);
      setSuccessMessage(null);
      
      await updateUserRole(user._id, newRole);
      
      // Update the user in the local state
      setUsers(prevUsers => prevUsers.map(u => 
        u._id === user._id ? { ...u, role: newRole, isStaff: newRole === 'staff' } : u
      ));
      
      setSuccessMessage(`${user.name}'s role has been updated to ${newRole}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setProcessingUser(null);
      setEditingUserId(null);
    }
  };

  const handleViewUserDetails = (userId: string) => {
    setViewingUserId(userId);
    setIsUserDetailsOpen(true);
  };

  const handleCloseUserDetails = () => {
    setIsUserDetailsOpen(false);
    setViewingUserId(null);
  };

  const getRoleBadgeClass = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge badge--admin';
      case 'staff':
        return 'badge badge--staff';
      default:
        return 'badge badge--user';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="user-management-modal">
        <div className="modal-header">
          <h2>User Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">Search</button>
            </form>
            
            <div className="filters">
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="user">User</option>
              </select>
              
              <select 
                value={activeFilter} 
                onChange={(e) => setActiveFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {successMessage && (
            <div className="success-message">
              <p>{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => fetchUsers()}>Retry</button>
            </div>
          ) : (
            <>
              <div className="users-count">
                <strong>{users.length}</strong> users found
              </div>
              
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="no-results">No users found</td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={getRoleBadgeClass(user.role)}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td className="actions-cell">
                            <button 
                              className="action-btn view-btn" 
                              title="View User Details"
                              onClick={() => handleViewUserDetails(user._id)}
                            >
                              <span>View</span>
                            </button>
                            {editingUserId === user._id ? (
                              <div className="role-selector">
                                <select 
                                  value={selectedRole || user.role}
                                  onChange={(e) => setSelectedRole(e.target.value)}
                                  className="role-select"
                                  disabled={processingUser === user._id}
                                >
                                  <option value="user">User</option>
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button 
                                  className="action-btn save-btn"
                                  onClick={() => handleChangeRole(user, selectedRole || user.role)}
                                  disabled={processingUser === user._id}
                                >
                                  {processingUser === user._id ? (
                                    <div className="button-spinner"></div>
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </button>
                                <button 
                                  className="action-btn cancel-btn"
                                  onClick={() => {
                                    setEditingUserId(null);
                                    setSelectedRole('');
                                  }}
                                  disabled={processingUser === user._id}
                                >
                                  <span>Cancel</span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  className="action-btn edit-btn" 
                                  title="Change Role"
                                  onClick={() => {
                                    setEditingUserId(user._id);
                                    setSelectedRole(user.role);
                                  }}
                                >
                                  <span>Change Role</span>
                                </button>
                                {user.role !== 'admin' && (
                                  <button 
                                    className={`action-btn ${user.isActive ? 'delete-btn' : 'activate-btn'}`} 
                                    title={user.isActive ? 'Deactivate User' : 'Reactivate User'}
                                    onClick={() => handleToggleUserStatus(user)}
                                    disabled={processingUser === user._id}
                                  >
                                    {processingUser === user._id ? (
                                      <div className="button-spinner"></div>
                                    ) : user.isActive ? (
                                      <span>Deactivate</span>
                                    ) : (
                                      <span>Activate</span>
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* User Details Modal */}
      {viewingUserId && (
        <UserDetailsModal 
          isOpen={isUserDetailsOpen}
          onClose={handleCloseUserDetails}
          userId={viewingUserId}
        />
      )}
    </div>
  );
};

export default UserManagement;