// sidebar.types.ts
export interface MenuItem {
  icon: string;
  label: string;
  route: string;        // Route path
  routerLink?: string;  // Legacy support for routerLink - add this property
  isAdminFeature?: boolean;
  children?: MenuItem[];
  badge?: string;
  active?: boolean;     // Whether this item is currently active - add this property
}

export interface MenuGroup {
  title: string;
  icon?: string;
  items: MenuItem[];
}

export interface NavItem {
  text: string;
  route?: string;
  icon: string;
  visible: boolean;
  children?: NavItem[];
  expanded?: boolean;
  badge?: string | number;
  badgeColor?: string;
}