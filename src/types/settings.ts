export type AppThemeMode = 'dark' | 'light' | 'system';
export type AppFontSize = 'sm' | 'md' | 'lg' | 'xl';
export type AppDisplayDensity = 'compact' | 'normal' | 'comfortable';
export type AppCardSpacing = 'compact' | 'normal' | 'relaxed';
export type TableFontSize = 'sm' | 'md' | 'lg';
export type TableRowHeight = 'compact' | 'normal' | 'relaxed';
export type ConnectorViewMode = 'grid' | 'cards' | 'compact';
export type PinDetailLevel = 'full' | 'summary' | 'diagram';
export type TechnicalDetailsMode = 'comprehensive' | 'focused';
export type VehicleCardLayout = 'grid' | 'list' | 'compact';
export type SearchSortOrder = 'relevance' | 'alpha' | 'newest';

export type SearchCategoryKey = 'all' | 'ecu' | 'fuses' | 'relays' | 'vehicles' | 'diagrams' | 'media';

export interface UserDisplaySettings {
  // 1. تنظیمات ظاهری (Appearance)
  themeMode: AppThemeMode;
  fontSize: AppFontSize;
  density: AppDisplayDensity;
  cardSpacing: AppCardSpacing;

  // 2. تنظیمات نمایش اطلاعات فنی (Technical Display)
  tableFontSize: TableFontSize;
  tableRowHeight: TableRowHeight;
  connectorViewMode: ConnectorViewMode;
  pinDetailLevel: PinDetailLevel;
  technicalDetailsMode: TechnicalDetailsMode;
  vehicleCardLayout: VehicleCardLayout;

  // 3. تنظیمات جستجو (Search)
  searchSaveLastCategory: boolean;
  searchLastCategory: SearchCategoryKey;
  searchEnabledCategories: SearchCategoryKey[];
  searchMaxResults: number; // 5, 10, 25, 50, 0 (0 = all)
  searchSortOrder: SearchSortOrder;
}

export const DEFAULT_DISPLAY_SETTINGS: UserDisplaySettings = {
  themeMode: 'dark',
  fontSize: 'md',
  density: 'normal',
  cardSpacing: 'normal',

  tableFontSize: 'md',
  tableRowHeight: 'normal',
  connectorViewMode: 'grid',
  pinDetailLevel: 'full',
  technicalDetailsMode: 'comprehensive',
  vehicleCardLayout: 'grid',

  searchSaveLastCategory: true,
  searchLastCategory: 'all',
  searchEnabledCategories: ['all', 'ecu', 'fuses', 'relays', 'vehicles', 'diagrams', 'media'],
  searchMaxResults: 25,
  searchSortOrder: 'relevance'
};
