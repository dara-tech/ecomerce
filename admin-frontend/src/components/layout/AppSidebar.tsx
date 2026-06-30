import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
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
  type LucideIcon,
} from 'lucide-react';
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
      { name: 'Returns', path: '/returns', icon: RotateCcw },
      { name: 'Coupons', path: '/coupons', icon: Ticket },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Users', path: '/users', icon: Users },
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

function NavLinkButton({ item }: { item: NavLinkItem }) {
  const location = useLocation();
  const active = isPathActive(location.pathname, item.path);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.name}
        render={<NavLink to={item.path} end={item.path === '/'} />}
      >
        <item.icon />
        <span>{item.name}</span>
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
          <item.icon />
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
              <child.icon />
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
          render={<SidebarMenuButton isActive={open} />}
        >
          <item.icon />
          <span>{item.name}</span>
          <ChevronRight className="sidebar-menu-chevron ml-auto size-4 transition-transform group-data-open/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton
                  isActive={location.pathname === child.path}
                  render={<NavLink to={child.path} end />}
                >
                  <child.icon />
                  <span>{child.name}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-border px-2 py-3 group-data-[collapsible=icon]:px-1.5">
        <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-black tracking-wider text-primary-foreground group-data-[collapsible=icon]:size-8">
            AD
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
            <p className="truncate text-xs text-muted-foreground">E-Commerce</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {NAV_GROUPS.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 && (
              <SidebarSeparator className="mx-auto my-1 hidden w-5 group-data-[collapsible=icon]:block" />
            )}
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:gap-0.5">
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

      <SidebarFooter className="border-t border-border p-2 group-data-[collapsible=icon]:hidden">
        <p className="px-2 text-[10px] text-muted-foreground">
          Press <kbd className="rounded border px-1 font-mono">⌘B</kbd> to toggle
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
