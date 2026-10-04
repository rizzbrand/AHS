import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  HardHat,
  LayoutDashboard,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  Users,
  Waypoints,
  Workflow,
  FileSpreadsheet,
  MapPinned,
  type LucideIcon
} from 'lucide-react';
import { Permission } from '../../lib/types';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  group: 'Operate' | 'Directory' | 'Commercial' | 'Control';
};

export const NAV: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard, permission: 'overview.read', group: 'Operate' },
  { href: '/work-orders', label: 'Work Orders', icon: ClipboardList, permission: 'jobs.read', group: 'Operate' },
  { href: '/dispatch', label: 'Dispatch', icon: Waypoints, permission: 'dispatch.read', group: 'Operate' },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, permission: 'calendar.read', group: 'Operate' },
  { href: '/customers', label: 'Customers', icon: Building2, permission: 'customers.read', group: 'Directory' },
  { href: '/properties', label: 'Properties', icon: MapPinned, permission: 'properties.read', group: 'Directory' },
  { href: '/workforce', label: 'Workforce', icon: Users, permission: 'workforce.read', group: 'Directory' },
  { href: '/contractors', label: 'Contractors', icon: HardHat, permission: 'contractors.read', group: 'Directory' },
  { href: '/documents', label: 'Documents', icon: FolderOpen, permission: 'documents.read', group: 'Directory' },
  { href: '/playbook', label: 'SOPs / Playbook', icon: BookOpen, permission: 'playbook.read', group: 'Directory' },
  { href: '/estimates', label: 'Quotes & Estimates', icon: FileSpreadsheet, permission: 'estimates.read', group: 'Commercial' },
  { href: '/invoices', label: 'Invoices', icon: Receipt, permission: 'invoices.read', group: 'Commercial' },
  { href: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports.read', group: 'Commercial' },
  { href: '/automations', label: 'Automations', icon: Workflow, permission: 'automations.read', group: 'Control' },
  { href: '/integrations', label: 'Integrations', icon: Plug, permission: 'integrations.read', group: 'Control' },
  { href: '/audit', label: 'Audit Log', icon: ScrollText, permission: 'audit.read', group: 'Control' },
  { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings.read', group: 'Control' }
];

export const CRUMB: Record<string, string> = {
  overview: 'Overview',
  'work-orders': 'Work Orders',
  dispatch: 'Dispatch',
  calendar: 'Calendar',
  customers: 'Customers',
  properties: 'Properties',
  workforce: 'Workforce',
  contractors: 'Contractors',
  documents: 'Documents',
  playbook: 'SOPs / Playbook',
  estimates: 'Quotes & Estimates',
  invoices: 'Invoices',
  reports: 'Reports',
  automations: 'Automations',
  integrations: 'Integrations',
  audit: 'Audit Log',
  settings: 'Settings',
  field: 'Field'
};
