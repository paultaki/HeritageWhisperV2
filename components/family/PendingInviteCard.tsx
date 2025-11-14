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

type PendingInviteCardProps = {
  member: {
    id: string;
    email: string;
    relationship: string | null;
    invited_at: string;
    inviteExpired?: boolean;
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
  const initial = member.email[0].toUpperCase();

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-12 h-12 md:w-14 md:h-14 shrink-0">
            <AvatarFallback className="bg-gray-300 text-gray-600 text-lg md:text-xl font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-base md:text-lg font-semibold text-gray-900 break-all mb-1.5 leading-tight">
              {member.email}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {member.relationship && (
                <Badge className="bg-white text-gray-700 border border-gray-300 text-xs px-2.5 py-0.5 font-medium rounded-full">
                  {member.relationship}
                </Badge>
              )}
              {member.inviteExpired && (
                <Badge className="bg-red-600 text-white border-0 text-xs px-2.5 py-0.5 font-medium rounded-full">
                  Expired
                </Badge>
              )}
            </div>

            <p className="text-xs md:text-sm text-gray-600">
              Invited {getRelativeTime(member.invited_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-3 border-t border-gray-200">
          <Button
            onClick={onResend}
            disabled={isResending}
            className="flex-1 min-h-[48px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
          >
            {isResending ? "Sending..." : "Resend Invitation"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none min-h-[48px] px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 text-sm md:text-base font-medium rounded-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
              >
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                  Cancel invitation?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-gray-600 leading-relaxed">
                  This will cancel the invitation to {member.email}. They won't be able
                  to use the invite link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                  Keep Invitation
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRevoke}
                  className="w-full min-h-[48px] px-6 py-3 bg-red-600 text-white text-base font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
                >
                  Cancel Invitation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
