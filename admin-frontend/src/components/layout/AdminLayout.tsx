import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Search,
  LogOut,
  Sun,
  Moon,
  CircleUser,
  Settings,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/lib/utils';
import EditProfileModal from './EditProfileModal';
import AppSidebar from './AppSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ACCENT_COLORS = [
  { id: 'orange', hex: '#f97316', name: 'Orange' },
  { id: 'blue', hex: '#3b82f6', name: 'Blue' },
  { id: 'purple', hex: '#8b5cf6', name: 'Purple' },
  { id: 'pink', hex: '#ec4899', name: 'Pink' },
  { id: 'green', hex: '#22c55e', name: 'Green' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [selectedColor, setSelectedColor] = useState(
    () => localStorage.getItem('app-accent-color') || 'orange'
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const displayName = user?.name || 'Admin';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-accent-color', selectedColor);
    const color = ACCENT_COLORS.find((c) => c.id === selectedColor);
    if (color) {
      document.documentElement.style.setProperty('--primary', color.hex);
    }
  }, [selectedColor]);

  const getInitials = (name: string) => {
    const clean = (name || '').trim();
    if (!clean) return 'A';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen min-h-0 flex-col overflow-hidden">
          <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-6">
            <Tooltip>
              <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
              <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mr-1 h-4 bg-border" />

            <div className="flex flex-1 items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                    />
                  }
                >
                  <Search className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Search</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full p-0"
                          />
                        }
                      />
                    }
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {getInitials(displayName)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{displayName}</TooltipContent>
                </Tooltip>

                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center gap-3 py-1">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {getInitials(displayName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user?.email || 'admin@admin.com'}
                          </p>
                        </div>
                        <Check className="size-4 shrink-0 text-primary" />
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
                    <CircleUser className="size-4" />
                    Edit profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <KeyRound className="size-4" />
                    Passwords
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
                    }}
                  >
                    {theme === 'dark' ? (
                      <Moon className="size-4 text-purple-400" />
                    ) : (
                      <Sun className="size-4 text-amber-500" />
                    )}
                    Dark mode
                    <span
                      className={cn(
                        'ml-auto inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                        theme === 'dark' ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block size-4 translate-x-0 rounded-full bg-white shadow-sm transition-transform',
                          theme === 'dark' && 'translate-x-4'
                        )}
                      />
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="px-2 py-1.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Accent color
                    </p>
                    <div className="flex items-center gap-2">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColor(color.id)}
                          title={color.name}
                          className={cn(
                            'size-5 rounded-full border-2 transition-transform hover:scale-110',
                            selectedColor === color.id
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <Outlet />
          </div>
        </SidebarInset>

        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}
