/**
 * Thin re-export — all consumers of this path now use the single canonical
 * TabNavigationContext from lib/TabNavigationContext.jsx, which is provided
 * once at the App.jsx level. This resolves the dual-context / split-stack bug
 * where layout components and page components were operating on separate
 * navigation histories.
 */
export {
  TabNavigationProvider,
  useTabNavigation,
} from '@/lib/TabNavigationContext';
