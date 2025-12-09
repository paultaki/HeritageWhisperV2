'use client';

import React, { useState } from 'react';
import { useAccountContext } from '@/hooks/use-account-context';
import { useAuth } from '@/lib/auth';
import { Check, ChevronDown, User, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AccountSwitcher() {
  const {
    activeContext,
    availableStorytellers,
    isLoading,
    switchToStoryteller,
    isOwnAccount,
  } = useAccountContext();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  // Filter out the user's own account from family storytellers
  // (own account is shown separately at the top)
  const familyStorytellers = availableStorytellers.filter(
    (s) => s.storytellerId !== user?.id
  );

  // Show loading only if context is loading OR if we don't have either user or activeContext
  if (isLoading || !activeContext) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </Button>
    );
  }

  // For family viewers (!user), show simple view - they can't switch accounts
  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="gap-2 bg-blue-50 border-2 border-blue-300 text-blue-900">
        <Users className="h-5 w-5 text-blue-600" />
        <span className="text-base font-semibold">{activeContext.storytellerName}</span>
      </Button>
    );
  }

  const handleSwitch = async (storytellerId: string) => {
    await switchToStoryteller(storytellerId);
    setIsOpen(false);
  };

  // Show compact button if no family storytellers available (only own account)
  if (familyStorytellers.length === 0) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">{activeContext.storytellerName}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 focus:ring-2 transition-colors mr-4 border-2 shadow-sm",
            isOwnAccount
              ? "bg-white hover:bg-accent border-gray-300 hover:border-amber-400 focus:ring-amber-500"
              : "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 hover:border-blue-400 focus:ring-blue-500"
          )}
        >
          {isOwnAccount ? (
            <User className="h-5 w-5 text-amber-600" />
          ) : (
            <Users className="h-5 w-5 text-blue-600" />
          )}
          <span className="text-base font-semibold max-w-[200px] truncate">
            {isOwnAccount ? (user?.name || activeContext.storytellerName) : activeContext.storytellerName}
          </span>
          <ChevronDown className={cn(
            "h-5 w-5",
            isOwnAccount ? "text-amber-600" : "text-blue-600"
          )} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
          Switch Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Own Account */}
        <DropdownMenuItem
          onClick={() => handleSwitch(user.id)}
          className={cn(
            'flex items-center gap-3 px-3 py-3 cursor-pointer',
            isOwnAccount && 'bg-accent'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate text-gray-900">{user.name || 'Your Stories'}</p>
            <p className="text-sm text-gray-600">Your Stories</p>
          </div>
          {isOwnAccount && <Check className="h-5 w-5 text-amber-600" />}
        </DropdownMenuItem>

        {familyStorytellers.length > 0 && (
          <React.Fragment key="family-section">
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              Family Stories
            </DropdownMenuLabel>

            {familyStorytellers.map((storyteller) => {
              const isActive = activeContext.storytellerId === storyteller.storytellerId;

              return (
                <DropdownMenuItem
                  key={storyteller.storytellerId}
                  onClick={() => handleSwitch(storyteller.storytellerId)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 cursor-pointer',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate text-gray-900">{storyteller.storytellerName}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {storyteller.relationship && (
                        <span className="truncate">{storyteller.relationship}</span>
                      )}
                      {storyteller.permissionLevel === 'contributor' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          Contributor
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-blue-600" />}
                </DropdownMenuItem>
              );
            })}
          </React.Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
