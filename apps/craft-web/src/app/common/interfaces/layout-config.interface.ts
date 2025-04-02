/**
 * Layout configuration interface
 * Defines available options for configuring the application layout
 */
export interface LayoutConfig {
  /**
   * Whether to hide the header
   */
  hideHeader?: boolean;
  
  /**
   * Whether to hide the footer
   */
  hideFooter?: boolean;
  
  /**
   * Whether to hide the sidebar
   */
  hideSidebar?: boolean;
  
  /**
   * Custom CSS class to apply to the layout container
   */
  customClass?: string;
  
  /**
   * Alternative way to specify header visibility (true = show header)
   */
  header?: boolean;
  
  /**
   * Alternative way to specify footer visibility (true = show footer)
   */
  footer?: boolean;
  
  /**
   * Alternative way to specify sidebar visibility (true = show sidebar)
   */
  sidebar?: boolean;
}
