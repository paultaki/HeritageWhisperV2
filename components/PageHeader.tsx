"use client";

import React from "react";
import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import { AccountSwitcher } from "./AccountSwitcher";
import { useAccountContext } from "@/hooks/use-account-context";

/**
 * Props for page header components
 * Following composition pattern for flexibility
 */
interface PageHeaderProps {
  /** Lucide icon component to display next to title */
  icon: LucideIcon;
  /** Main page title */
  title: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Whether to show account switcher (desktop only, when viewing another account) */
  showAccountSwitcher?: boolean;
  /** Custom content to render on the left side of the header (mobile only) */
  leftContent?: React.ReactNode;
  /** Custom content to render on the right side of the header */
  rightContent?: React.ReactNode;
}

/**
 * Universal Desktop Page Header Component
 * 
 * A consistent header for all desktop pages with:
 * - Logo branding
 * - Page icon and title
 * - Optional subtitle
 * - Account switcher (when viewing someone else's account)
 * - Flexible right content area
 * 
 * @example
 * ```tsx
 * <DesktopPageHeader
 *   icon={BookOpen}
 *   title="Memory Box"
 *   subtitle="Manage your memories"
 *   showAccountSwitcher={true}
 *   rightContent={<Button>Action</Button>}
 * />
 * ```
 */
export function DesktopPageHeader({
  icon: Icon,
  title,
  subtitle,
  showAccountSwitcher = false,
  rightContent,
}: PageHeaderProps): JSX.Element {
  const { isOwnAccount } = useAccountContext();
  
  return (
    <header 
      className="hidden md:block sticky top-0 z-40 bg-white border-b"
      role="banner"
      style={{ height: '62px' }}
    >
      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Branding and page identity */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo */}
            <Image
              src="/circle logo hw.svg"
              alt="Heritage Whisper Logo"
              width={65}
              height={65}
              className="w-[65px] h-[65px] flex-shrink-0 relative"
              style={{ top: '-10px' }}
              priority
            />
            
            {/* Page Icon */}
            <Icon 
              className="w-7 h-7 text-gray-700 flex-shrink-0 relative" 
              style={{ top: '-17px' }}
              aria-hidden="true"
            />
            
            {/* Page Title and Subtitle */}
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-gray-900 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 truncate mt-0.5 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right section - Actions and account switcher */}
          <nav className="flex items-center gap-3 flex-shrink-0" aria-label="Page actions">
            {rightContent}
            {showAccountSwitcher && !isOwnAccount && (
              <AccountSwitcher />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

/**
 * Universal Mobile Page Header Component
 * 
 * A consistent header for all mobile pages with:
 * - Compact logo branding
 * - Page icon and title
 * - Optional subtitle
 * - Flexible right content area
 * 
 * Note: Mobile doesn't show account switcher as it uses bottom navigation
 * 
 * @example
 * ```tsx
 * <MobilePageHeader
 *   icon={BookOpen}
 *   title="Memory Box"
 *   subtitle="Manage memories"
 *   rightContent={<IconButton>+</IconButton>}
 * />
 * ```
 */
export function MobilePageHeader({
  icon: Icon,
  title,
  subtitle,
  leftContent,
  rightContent,
}: Omit<PageHeaderProps, 'showAccountSwitcher'>): JSX.Element {
  return (
    <header
      className="md:hidden sticky top-0 z-40 bg-white border-b"
      role="banner"
      style={{ height: '52px' }}
    >
      <div className="px-4" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
        <div className="flex items-center justify-between gap-2">
          {/* Left section with hamburger menu */}
          {leftContent && (
            <div className="flex-shrink-0">
              {leftContent}
            </div>
          )}

          {/* Center section - Compact branding and page identity */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Logo - Smaller for mobile */}
            <Image
              src="/circle logo hw.svg"
              alt="Heritage Whisper Logo"
              width={48}
              height={48}
              className="w-[48px] h-[48px] flex-shrink-0 relative"
              style={{ top: '-6px' }}
              priority
            />

            {/* Page Icon */}
            <Icon
              className="w-6 h-6 text-gray-700 flex-shrink-0 relative"
              style={{ top: '-11px' }}
              aria-hidden="true"
            />

            {/* Page Title and Subtitle */}
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-600 truncate mt-0.5 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right section - Custom actions only */}
          {rightContent && (
            <nav className="flex items-center gap-2 flex-shrink-0" aria-label="Page actions">
              {rightContent}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
