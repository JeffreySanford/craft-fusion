// sidebar.types.ts
export interface MenuItem {
  icon: string;
  label: string;
  routerLink: string;
  active: boolean;
  isAdmin?: boolean; // Add optional property to identify admin items
}

export interface MenuGroup {
  title: string;
  icon?: string;
  items: MenuItem[];
}