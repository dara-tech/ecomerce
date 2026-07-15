import { Fragment, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getApiBase } from '@/lib/axios';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  User,
  Settings,
  Shield,
  FolderTree,
  Bookmark,
  CreditCard,
  FileText,
  Image,
  HelpCircle,
  FileBox,
  Megaphone,
  Mail,
  Bell,
  MessageSquare,
  Zap,
  Truck,
  Warehouse,
  Ticket,
  Star,
  Heart,
  BellRing,
  BarChart3,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Search,
  Store,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type NavLinkItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

type NavCollapsibleItem = {
  name: string;
  icon: LucideIcon;
  paths: string[];
  children: NavLinkItem[];
};

type NavEntry = NavLinkItem | NavCollapsibleItem;

type NavGroup = {
  label: string;
  items: NavEntry[];
};

function isCollapsible(item: NavEntry): item is NavCollapsibleItem {
  return 'children' in item;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      {
        name: 'Products',
        icon: Package,
        paths: ['/products', '/categories', '/brands'],
        children: [
          { name: 'All Products', path: '/products', icon: Package },
          { name: 'Categories', path: '/categories', icon: FolderTree },
          { name: 'Brands', path: '/brands', icon: Bookmark },
        ],
      },
    ],
  },
  {
    label: 'Store',
    items: [
      { name: 'Orders', path: '/orders', icon: ShoppingCart },
      { name: 'Shipping', path: '/shipping', icon: Truck },
      { name: 'Inventory', path: '/inventory', icon: Warehouse },
      { name: 'Payments', path: '/payments', icon: CreditCard },
      { name: 'Payouts', path: '/payouts', icon: DollarSign },
      { name: 'Returns', path: '/returns', icon: RotateCcw },
      { name: 'Coupons', path: '/coupons', icon: Ticket },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Live Chat', path: '/live-chat', icon: MessageCircle },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Stores', path: '/stores', icon: Store },
      { name: 'Reviews', path: '/reviews', icon: Star },
      { name: 'Wishlists', path: '/wishlists', icon: Heart },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        name: 'Marketing',
        icon: Megaphone,
        paths: ['/marketing'],
        children: [
          { name: 'Email Campaigns', path: '/marketing/email-campaigns', icon: Mail },
          { name: 'Push Notifications', path: '/marketing/push-notifications', icon: Bell },
          { name: 'Banner Management', path: '/marketing/banners', icon: Image },
          { name: 'Popups', path: '/marketing/popups', icon: MessageSquare },
          { name: 'Flash Sales', path: '/marketing/flash-sales', icon: Zap },
        ],
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        name: 'CMS',
        icon: FileText,
        paths: ['/cms'],
        children: [
          { name: 'Pages', path: '/cms/pages', icon: FileBox },
          { name: 'FAQs', path: '/cms/faqs', icon: HelpCircle },
          { name: 'Blogs', path: '/cms/blogs', icon: FileText },
        ],
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Notifications', path: '/notifications', icon: BellRing },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Security', path: '/security', icon: Shield },
    ],
  },
];

function isPathActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isCollapsibleActive(pathname: string, item: NavCollapsibleItem) {
  return item.paths.some((prefix) => pathname.startsWith(prefix));
}

function getIconBgColor(name: string): string {
  switch (name) {
    case 'Dashboard': return 'bg-[#0A84FF] text-white'; // Blue
    case 'Products': return 'bg-[#FF9F0A] text-white'; // Orange
    case 'All Products': return 'bg-[#FF9F0A] text-white';
    case 'Categories': return 'bg-[#30D158] text-white'; // Green
    case 'Brands': return 'bg-[#BF5AF2] text-white'; // Purple
    case 'Orders': return 'bg-[#FF453A] text-white'; // Red
    case 'Shipping': return 'bg-[#64D2FF] text-white'; // Teal
    case 'Inventory': return 'bg-[#D4A373] text-white'; // Amber/brown
    case 'Payments': return 'bg-[#34C759] text-white'; // Green
    case 'Returns': return 'bg-[#5E5CE6] text-white'; // Indigo
    case 'Coupons': return 'bg-[#FF375F] text-white'; // Pink
    case 'Live Chat': return 'bg-[#30D158] text-white'; // Green
    case 'Users': return 'bg-[#007AFF] text-white'; // Blue
    case 'Stores': return 'bg-[#AF52DE] text-white'; // Purple/Indigo
    case 'My Store': return 'bg-[#AF52DE] text-white';
    case 'Reviews': return 'bg-[#FFD60A] text-white'; // Yellow
    case 'Wishlists': return 'bg-[#FF2D55] text-white'; // Rose
    case 'Marketing': return 'bg-gradient-to-tr from-[#FF2D55] to-[#FF9F0A] text-white';
    case 'Email Campaigns': return 'bg-[#007AFF] text-white';
    case 'Push Notifications': return 'bg-[#FF3B30] text-white';
    case 'Banner Management': return 'bg-[#34C759] text-white';
    case 'Popups': return 'bg-[#BF5AF2] text-white';
    case 'Flash Sales': return 'bg-[#FF9F0A] text-white';
    case 'CMS': return 'bg-[#8E8E93] text-white'; // Grey
    case 'Pages': return 'bg-[#8E8E93] text-white';
    case 'FAQs': return 'bg-[#8E8E93] text-white';
    case 'Blogs': return 'bg-[#8E8E93] text-white';
    case 'Notifications': return 'bg-[#FF3B30] text-white';
    case 'Reports': return 'bg-[#00C7BE] text-white';
    case 'Settings': return 'bg-[#8E8E93] text-white';
    case 'Security': return 'bg-[#1C1C1E] text-white';
    default: return 'bg-[#8E8E93] text-white';
  }
}

function NavLinkButton({ item }: { item: NavLinkItem }) {
  const location = useLocation();
  const active = isPathActive(location.pathname, item.path);
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (item.name !== 'Live Chat' || !token) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`${getApiBase()}/chat/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const count = sessions.filter((s: any) => {
            if (!s.messages || s.messages.length === 0) return false;
            const lastMsg = s.messages[s.messages.length - 1];
            if (lastMsg.from !== 'user') return false;
            if (!s.lastSeenByAdmin) return true;
            return new Date(lastMsg.createdAt).getTime() > new Date(s.lastSeenByAdmin).getTime();
          }).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [item.name, token]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.name}
        className={cn(
          "w-full h-9 flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all my-[2px]",
          active
            ? "bg-[#007AFF] text-white shadow-sm"
            : "text-sidebar-foreground hover:bg-[#E5E5EA]/55 dark:hover:bg-[#2C2C2E]/55"
        )}
        render={<NavLink to={item.path} end={item.path === '/'} />}
      >
        <div className={cn(
          "size-6 flex items-center justify-center rounded-md shrink-0 shadow-sm",
          getIconBgColor(item.name)
        )}>
          <item.icon className="size-3.5 stroke-[2.25]" />
        </div>
        <span>{item.name}</span>
        {item.name === 'Live Chat' && unreadCount > 0 && (
          <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavCollapsibleFlyout({ item }: { item: NavCollapsibleItem }) {
  const location = useLocation();
  const active = isCollapsibleActive(location.pathname, item);

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuButton isActive={active} />}
        >
          <div className={cn(
            "size-6 flex items-center justify-center rounded-md shrink-0 shadow-sm",
            getIconBgColor(item.name)
          )}>
            <item.icon className="size-3.5 stroke-[2.25]" />
          </div>
          <span>{item.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="min-w-52"
        >
          <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
          {item.children.map((child) => (
            <DropdownMenuItem
              key={child.path}
              render={<NavLink to={child.path} end />}
              className={cn(
                location.pathname === child.path && 'bg-accent text-accent-foreground'
              )}
            >
              <div className={cn(
                "size-5 flex items-center justify-center rounded-sm shrink-0 mr-1.5",
                getIconBgColor(child.name)
              )}>
                <child.icon className="size-3 stroke-[2.25]" />
              </div>
              {child.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function NavCollapsibleButton({ item }: { item: NavCollapsibleItem }) {
  const location = useLocation();
  const { state } = useSidebar();
  const open = isCollapsibleActive(location.pathname, item);

  if (state === 'collapsed') {
    return <NavCollapsibleFlyout item={item} />;
  }

  return (
    <Collapsible defaultOpen={open} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          className={cn(
            "w-full h-9 flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all my-[2px]",
            open
              ? "text-sidebar-foreground"
              : "text-sidebar-foreground hover:bg-[#E5E5EA]/55 dark:hover:bg-[#2C2C2E]/55"
          )}
          render={<SidebarMenuButton isActive={open} />}
        >
          <div className={cn(
            "size-6 flex items-center justify-center rounded-md shrink-0 shadow-sm",
            getIconBgColor(item.name)
          )}>
            <item.icon className="size-3.5 stroke-[2.25]" />
          </div>
          <span>{item.name}</span>
          <ChevronRight className="sidebar-menu-chevron ml-auto size-3.5 transition-transform group-data-open/collapsible:rotate-90 text-muted-foreground/60" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-3 border-l-0 pl-0">
            {item.children.map((child) => {
              const childActive = location.pathname === child.path;
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton
                    size="sm"
                    isActive={childActive}
                    className={cn(
                      "w-full h-8 flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all my-[2px]",
                      childActive
                        ? "bg-[#007AFF] text-white shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-[#E5E5EA]/55 dark:hover:bg-[#2C2C2E]/55"
                    )}
                    render={<NavLink to={child.path} end />}
                  >
                    <div className={cn(
                      "size-5 flex items-center justify-center rounded-sm shrink-0 shadow-sm",
                      getIconBgColor(child.name)
                    )}>
                      <child.icon className="size-3 stroke-[2.25]" />
                    </div>
                    <span>{child.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();
  const initial = user?.name?.charAt(0).toUpperCase();

  const isVendor = user?.role === 'vendor';
  const filteredGroups = NAV_GROUPS.map((group) => {
    if (isVendor) {
      if (group.label === 'Overview') return group;
      if (group.label === 'Catalog') {
        const productsItem = group.items.find((item) => item.name === 'Products') as NavCollapsibleItem;
        if (productsItem) {
          return {
            ...group,
            items: [
              {
                ...productsItem,
                paths: ['/products'],
                children: productsItem.children.filter((c) => c.name === 'All Products'),
              },
            ],
          };
        }
      }
      if (group.label === 'Store') {
        return {
          ...group,
          items: [
            { name: 'My Store', path: '/my-store', icon: Store },
            ...group.items.filter((item) => ['Orders', 'Payouts'].includes(item.name)),
          ],
        };
      }
      return null;
    }
    return group;
  }).filter(Boolean) as NavGroup[];

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="bg-[#F2F2F7] dark:bg-[#1C1C1E]">
      <SidebarHeader className="border-b border-border/40 px-3 py-3 gap-2 group-data-[collapsible=icon]:px-1.5">
        {/* macOS Search bar */}
        <div className="px-0.5 py-0.5 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-7 pl-8 pr-2.5 rounded-lg bg-[#E5E5EA]/70 dark:bg-[#2C2C2E]/70 text-xs border-none outline-none placeholder:text-muted-foreground/60 focus:bg-[#E5E5EA]/90 dark:focus:bg-[#2C2C2E]/90 transition-colors"
            />
          </div>
        </div>

        {/* macOS Apple Account profile section */}
        {user && (
          <div className="mt-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3 p-1.5 rounded-xl bg-card border border-border/40 shadow-sm cursor-pointer hover:bg-[#E5E5EA]/20 dark:hover:bg-[#2C2C2E]/20 transition-all">
              <div className="size-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-black text-white shrink-0 overflow-hidden border border-border/20 shadow-inner">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  initial || <User className="size-4 text-white/90" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-sidebar-foreground truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email || 'Admin Account'}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1.5 py-2">
        {filteredGroups.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 && (
              <SidebarSeparator className="mx-auto my-1.5 hidden w-5 group-data-[collapsible=icon]:block" />
            )}
            <SidebarGroup className="px-0.5 py-1">
              <SidebarGroupLabel className="px-2 py-1 text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:gap-1">
                  {group.items.map((item) =>
                    isCollapsible(item) ? (
                      <NavCollapsibleButton key={item.name} item={item} />
                    ) : (
                      <NavLinkButton key={item.path} item={item} />
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2 group-data-[collapsible=icon]:hidden">
        <p className="px-2 text-[10px] text-muted-foreground/80">
          Press <kbd className="rounded border px-1 font-mono text-[9px]">⌘B</kbd> to toggle
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
