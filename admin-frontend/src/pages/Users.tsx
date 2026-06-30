import { useState, useEffect } from 'react';
import { Search, Trash2, ShieldCheck, User as UserIcon, Users as UsersIcon, Mail } from 'lucide-react';
import api from '../lib/axios';
import { PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS } from '../lib/pageToolbar';
import DataTableShell from '../components/layout/DataTableShell';
import Loading from '../components/ui/Loading';
import ConfirmModal from '../components/ui/ConfirmModal';
import { cn } from '../lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatar?: string;
  status?: string;
  isEmailVerified?: boolean;
  phone?: string;
  lastLogin?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Single Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectableUsers = filteredUsers.filter(u => u.role !== 'admin');

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map(u => u._id)));
    }
  };

  const toggleSelect = (id: string, role: string) => {
    if (role === 'admin') return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/users/${deleteId}`);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      // Wait for all delete requests to finish
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/users/${id}`)));
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      alert('Failed to delete some users. Admin users cannot be deleted.');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkConfirm(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/users/${id}`, { status: newStatus });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      {/* Header Toolbar */}
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          {/* Search */}
          <div className="flex w-full gap-2 md:max-w-xs items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="h-8 px-3 rounded-none border border-destructive/20 bg-destructive/5 text-destructive text-[12px] font-semibold flex items-center gap-2 hover:bg-destructive/10 transition-colors w-full lg:w-auto"
            >
              <Trash2 className="size-4" />
              Delete ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      <div className={PAGE_LIST_BODY_CLASS}>
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-[11px] font-medium text-center rounded-none">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <DataTableShell>
          <table className="w-full text-left border-collapse">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === selectableUsers.length && selectableUsers.length > 0}
                    onChange={toggleSelectAll}
                    disabled={selectableUsers.length === 0}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary bg-card cursor-pointer disabled:opacity-50"
                  />
                </th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-16 text-center">Avatar</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">User Details</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-28">Status</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-28">Role</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-32">Joined</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={7} label="Loading users…" />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-none bg-muted/50 flex items-center justify-center">
                        <UsersIcon className="size-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-[14px] font-medium text-foreground">No users found</p>
                      <p className="text-[13px]">Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user._id} 
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 group",
                      selectedIds.has(user._id) && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user._id)}
                        onChange={() => toggleSelect(user._id, user.role)}
                        disabled={user.role === 'admin'}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary bg-card cursor-pointer disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-none mx-auto object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                          {user.role === 'admin' ? <ShieldCheck className="size-4" /> : <UserIcon className="size-4" />}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-[13px] flex items-center gap-2">
                        {user.name}
                        {user.isEmailVerified && <span className="w-1.5 h-1.5 rounded-none bg-green-500" title="Verified Email"></span>}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 flex flex-col gap-0.5">
                        <span>{user.email}</span>
                        {user.phone && <span>{user.phone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-none text-[9px] font-semibold uppercase tracking-wider border",
                        user.status === 'banned' 
                          ? "bg-destructive/10 text-destructive border-destructive/20" 
                          : "bg-green-500/10 text-green-600 border-green-500/20"
                      )}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-none text-[9px] font-semibold uppercase tracking-wider border",
                        user.role === 'admin' 
                          ? "bg-primary/20 text-primary border-primary/30" 
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="text-[12px]">{new Date(user.createdAt).toLocaleDateString()}</div>
                      {user.lastLogin && <div className="text-[10px] mt-0.5 opacity-70">Last: {new Date(user.lastLogin).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.role !== 'admin' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(user._id, user.status === 'banned' ? 'active' : 'banned')}
                              className="px-2 py-1 text-[10px] font-medium border border-border/80 bg-input hover:bg-muted rounded-none transition-colors mr-1"
                            >
                              {user.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => setDeleteId(user._id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        ) : (
                          <div className="p-2 text-muted-foreground/30" title="Cannot delete admin">
                            <Trash2 className="size-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </DataTableShell>

      {/* Mobile Card View */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
        {loading ? (
          <Loading variant="panel" label="Loading users…" />
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-none border border-border/80">
            No users found matching your search.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user._id} 
              className="bg-card border border-border/80 rounded-none p-3 shadow-sm flex flex-col gap-3 relative group"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="size-12 rounded-none object-cover border border-border" />
                  ) : (
                    <div className="size-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      {user.role === 'admin' ? <ShieldCheck className="size-5" /> : <UserIcon className="size-5" />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="font-semibold text-[14px] text-foreground truncate flex items-center gap-1.5">
                    {user.name}
                    {user.isEmailVerified && <span className="w-1.5 h-1.5 rounded-none bg-green-500" title="Verified Email"></span>}
                  </div>
                  <div className="flex flex-col gap-0.5 text-[12px] text-muted-foreground mt-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && <div className="truncate pl-4.5">{user.phone}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border",
                      user.role === 'admin' 
                        ? "bg-primary/20 text-primary border-primary/30" 
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {user.role}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border",
                      user.status === 'banned' 
                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                        : "bg-green-500/10 text-green-600 border-green-500/20"
                    )}>
                      {user.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkbox (Bottom Row) */}
              <div 
                className="flex items-center justify-between pt-3 border-t border-border/50"
              >
                <label className={cn("flex items-center gap-2", user.role === 'admin' ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user._id)}
                    onChange={() => toggleSelect(user._id, user.role)}
                    disabled={user.role === 'admin'}
                    className="w-4 h-4 rounded border-border/80 text-primary focus:ring-primary focus:ring-offset-background bg-card cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-[12px] font-medium text-muted-foreground">Select</span>
                </label>
                <div className="flex items-center gap-2">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleUpdateStatus(user._id, user.status === 'banned' ? 'active' : 'banned')}
                      className="px-2 py-1 text-[11px] font-medium border border-border/80 bg-input hover:bg-muted rounded-none transition-colors"
                    >
                      {user.status === 'banned' ? 'Unban' : 'Ban'}
                    </button>
                  )}
                  <button 
                    onClick={() => setDeleteId(user._id)}
                    disabled={user.role === 'admin'}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-none hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Delete Users"
        message={`Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`}
        isDeleting={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />
    </div>
  );
};

export default Users;
