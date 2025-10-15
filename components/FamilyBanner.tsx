'use client';

import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FamilyBanner({ 
  storytellerName 
}: { 
  storytellerName: string 
}) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">
              Viewing {storytellerName}'s Stories
            </p>
            <p className="text-sm text-amber-700">Read-only access</p>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-amber-100 text-amber-800 border-amber-300 hidden sm:flex items-center gap-1"
        >
          <span>👁</span>
          <span>View Only</span>
        </Badge>
      </div>
    </div>
  );
}
