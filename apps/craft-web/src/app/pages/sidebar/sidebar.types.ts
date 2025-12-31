// sidebar.types.ts
export interface MenuItem {
  icon: string;
  label: string;
  routerLink: string;
  active?: boolean;
}

export interface MenuGroup {
  title: string;
  icon: string;
  items: MenuItem[];
  active?: boolean;
}
