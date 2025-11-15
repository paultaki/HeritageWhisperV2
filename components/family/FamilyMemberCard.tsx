import { Clock, Trash2, Link as LinkIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4 md:p-5">
        {/* Top section: Avatar + Info + Remove button */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-14 h-14 md:w-16 md:h-16 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xl md:text-2xl font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 truncate leading-tight">
                  {displayName}
                </h3>
              </div>

              {/* Remove button - desktop */}
              <div className="hidden md:block">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                        Remove family member?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base text-gray-600 leading-relaxed">
                        {displayName} will no longer be able to view your stories. You can
                        always invite them again later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                      <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onRemove}
                        className="w-full min-h-[48px] px-6 py-3 bg-red-600 text-white text-base font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {member.relationship && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-sm md:text-base px-3 py-1 font-medium rounded-full mb-2">
                {member.relationship}
              </Badge>
            )}

            <p className="text-sm md:text-base text-gray-600 break-all mb-1">
              {member.email}
            </p>

            {member.last_accessed_at && (
              <p className="flex items-center gap-1.5 text-sm md:text-base text-gray-500">
                <Clock className="w-4 h-4" />
                Last viewed {getRelativeTime(member.last_accessed_at)}
              </p>
            )}
          </div>
        </div>

        {/* Bottom section: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 pt-3 border-t border-gray-100">
          <div className="flex-1">
            <Button
              onClick={onSendLoginLink}
              disabled={isSendingLink}
              className="w-full min-h-[48px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
            >
              <LinkIcon className="w-5 h-5 mr-2" />
              {isSendingLink ? "Sending..." : "Send Sign-In Link"}
            </Button>
            <p className="hidden md:block text-sm text-gray-500 mt-1.5 ml-0.5 leading-snug">
              Sends them a one-click link to sign in
            </p>
          </div>

          {/* Remove button - mobile */}
          <div className="md:hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] px-5 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-sm font-medium rounded-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                    Remove family member?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-gray-600 leading-relaxed">
                    {displayName} will no longer be able to view your stories. You can
                    always invite them again later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                  <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRemove}
                    className="w-full min-h-[48px] px-6 py-3 bg-red-600 text-white text-base font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Card>
  );
}
