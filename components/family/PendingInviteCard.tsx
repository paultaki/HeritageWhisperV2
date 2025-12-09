import { Mail, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

type PendingInviteCardProps = {
  member: {
    id: string;
    name?: string | null;
    email: string;
    relationship: string | null;
    invited_at: string;
    inviteExpired?: boolean;
    inviteExpiresAt?: string | null;
  };
  onResend: () => void;
  onRevoke: () => void;
  isResending: boolean;
  getRelativeTime: (date: string) => string;
};

export function PendingInviteCard({
  member,
  onResend,
  onRevoke,
  isResending,
  getRelativeTime,
}: PendingInviteCardProps) {
  const displayName = member.name || member.email.split("@")[0];
  const initial = (member.name || member.email)[0].toUpperCase();

  // Format expiration date
  const formatExpirationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="bg-[#EFE6DA]/50 border border-[#D2C9BD] rounded-xl overflow-hidden">
      <div className="p-4 md:p-5 relative">
        {/* Trash icon in top-right corner */}
        <div className="absolute top-3 right-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg text-[#8A8378] hover:text-[#B91C1C] hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954]"
                aria-label="Cancel invitation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-semibold text-[#1F1F1F]">
                  Cancel invitation?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-[#4A4A4A] leading-relaxed">
                  This will cancel the invitation to {member.email}. They won't be able
                  to use the invite link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-[#1F1F1F] text-base font-medium border border-[#D2C9BD] rounded-xl hover:bg-[#EFE6DA] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-200">
                  Keep Invitation
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRevoke}
                  className="w-full min-h-[48px] px-6 py-3 bg-[#B91C1C] text-white text-base font-medium rounded-xl hover:bg-[#991B1B] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B91C1C] transition-all duration-200"
                >
                  Cancel Invitation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Main content */}
        <div className="flex items-start gap-4 pr-10">
          {/* Soft gold avatar with pending styling */}
          <Avatar className="w-14 h-14 md:w-16 md:h-16 shrink-0">
            <AvatarFallback className="bg-[#F4E6CC]/70 text-[#203954]/60 text-xl md:text-2xl font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-semibold text-[#1F1F1F]/80 truncate leading-tight mb-1">
              {displayName}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-[#E0E5ED] text-[#4A4A4A] border-0 text-sm px-3 py-1 font-medium rounded-full">
                Pending
              </Badge>
              {member.relationship && (
                <Badge className="bg-white text-[#4A4A4A] border border-[#D2C9BD] text-sm px-3 py-1 font-medium rounded-full">
                  {member.relationship}
                </Badge>
              )}
              {member.inviteExpired && (
                <Badge className="bg-[#B91C1C] text-white border-0 text-sm px-3 py-1 font-medium rounded-full">
                  Expired
                </Badge>
              )}
            </div>

            <p className="text-sm md:text-base text-[#4A4A4A] break-all mb-1">
              {member.email}
            </p>

            <p className="text-sm md:text-base text-[#8A8378]">
              Invited {getRelativeTime(member.invited_at)}
              {member.inviteExpiresAt && !member.inviteExpired && (
                <span className="mx-1">·</span>
              )}
              {member.inviteExpiresAt && !member.inviteExpired && (
                <span>Link expires {formatExpirationDate(member.inviteExpiresAt)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Resend action - ghost/text style */}
        <div className="mt-4 pt-4 border-t border-[#D2C9BD]">
          <button
            onClick={onResend}
            disabled={isResending}
            className="inline-flex items-center gap-2 text-[#203954] hover:text-[#1B3047] text-base font-medium hover:underline focus:outline-none focus:underline disabled:opacity-50 disabled:no-underline transition-colors"
          >
            <Mail className="w-4 h-4" />
            {isResending ? "Sending..." : "Resend invitation"}
          </button>
        </div>
      </div>
    </Card>
  );
}
