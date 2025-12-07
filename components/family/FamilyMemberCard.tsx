import { Clock, Trash2, Link as LinkIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FamilyMemberCardProps = {
  member: {
    id: string;
    name: string | null;
    email: string;
    relationship: string | null;
    last_accessed_at: string | null;
  };
  onSendLoginLink: () => void;
  onRemove: () => void;
  isSendingLink: boolean;
  getRelativeTime: (date: string) => string;
};

export function FamilyMemberCard({
  member,
  onSendLoginLink,
  onRemove,
  isSendingLink,
  getRelativeTime,
}: FamilyMemberCardProps) {
  const displayName = member.name || member.email.split("@")[0];
  const initial = (member.name || member.email)[0].toUpperCase();

  return (
    <Card className="bg-white border border-[#D2C9BD] rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4 md:p-5 relative">
        {/* Trash icon in top-right corner */}
        <div className="absolute top-3 right-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg text-[#8A8378] hover:text-[#B91C1C] hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954]"
                aria-label="Remove member"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-semibold text-[#1F1F1F]">
                  Remove family member?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-[#4A4A4A] leading-relaxed">
                  {displayName} will no longer be able to view your stories. You can
                  always invite them again later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-[#1F1F1F] text-base font-medium border border-[#D2C9BD] rounded-xl hover:bg-[#EFE6DA] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-200">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemove}
                  className="w-full min-h-[48px] px-6 py-3 bg-[#B91C1C] text-white text-base font-medium rounded-xl hover:bg-[#991B1B] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B91C1C] transition-all duration-200"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Main content */}
        <div className="flex items-start gap-4 pr-10">
          {/* Soft gold avatar */}
          <Avatar className="w-14 h-14 md:w-16 md:h-16 shrink-0">
            <AvatarFallback className="bg-[#F4E6CC] text-[#203954] text-xl md:text-2xl font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-semibold text-[#1F1F1F] truncate leading-tight mb-1">
              {displayName}
            </h3>

            {member.relationship && (
              <Badge className="bg-[#E0E5ED] text-[#203954] border-0 text-sm px-3 py-1 font-medium rounded-full mb-2">
                {member.relationship}
              </Badge>
            )}

            <p className="text-sm md:text-base text-[#4A4A4A] break-all mb-1">
              {member.email}
            </p>

            {member.last_accessed_at && (
              <p className="flex items-center gap-1.5 text-sm md:text-base text-[#8A8378]">
                <Clock className="w-4 h-4" />
                Last viewed {getRelativeTime(member.last_accessed_at)}
              </p>
            )}
          </div>
        </div>

        {/* Send login link - always available for family members */}
        <div className="mt-4 pt-4 border-t border-[#D2C9BD]">
          <button
            onClick={onSendLoginLink}
            disabled={isSendingLink}
            className="inline-flex items-center gap-2 text-[#203954] hover:text-[#1B3047] text-base font-medium hover:underline focus:outline-none focus:underline disabled:opacity-50 disabled:no-underline transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            {isSendingLink ? "Sending..." : "Send sign-in link"}
          </button>
        </div>
      </div>
    </Card>
  );
}
