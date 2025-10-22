'use client';

import { useState } from 'react';
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

  console.log('[AccountSwitcher] Render state:', {
    isLoading,
    activeContext,
    availableStorytellers,
    isOwnAccount,
    userId: user?.id,
  });

  if (isLoading || !activeContext || !user) {
    console.log('[AccountSwitcher] Showing loading state');
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </Button>
    );
  }

  const handleSwitch = async (storytellerId: string) => {
    await switchToStoryteller(storytellerId);
    setIsOpen(false);
  };

  // Show compact button if no other storytellers available
  if (availableStorytellers.length === 0) {
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
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 focus:ring-2 transition-colors",
            isOwnAccount
              ? "hover:bg-accent focus:ring-amber-500"
              : "bg-blue-50 hover:bg-blue-100 text-blue-900 focus:ring-blue-500"
          )}
        >
          {isOwnAccount ? (
            <User className="h-4 w-4" />
          ) : (
            <Users className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm font-medium max-w-[200px] truncate">
            {activeContext.storytellerName}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50",
            !isOwnAccount && "text-blue-600"
          )} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Switch Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Own Account */}
        <DropdownMenuItem
          onClick={() => handleSwitch(user.id)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 cursor-pointer',
            isOwnAccount && 'bg-accent'
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || 'Your Stories'}</p>
            <p className="text-xs text-muted-foreground">Your Stories</p>
          </div>
          {isOwnAccount && <Check className="h-4 w-4 text-amber-600" />}
        </DropdownMenuItem>

        {availableStorytellers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Family Stories
            </DropdownMenuLabel>

            {availableStorytellers.map((storyteller) => {
              const isActive = activeContext.storytellerId === storyteller.storytellerId;

              return (
                <DropdownMenuItem
                  key={storyteller.storytellerId}
                  onClick={() => handleSwitch(storyteller.storytellerId)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 cursor-pointer',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{storyteller.storytellerName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {storyteller.relationship && (
                        <span className="truncate">{storyteller.relationship}</span>
                      )}
                      {storyteller.permissionLevel === 'contributor' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">
                          Contributor
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
