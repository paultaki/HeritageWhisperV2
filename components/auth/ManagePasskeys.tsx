"use client";

/**
 * ManagePasskeys Component
 *
 * Displays and manages user's registered passkeys.
 * Allows renaming and deleting passkeys with senior-friendly UI.
 */

import { useState, useEffect } from "react";
import { Fingerprint, Trash2, Edit2, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/auth";

interface Passkey {
  id: string;
  friendlyName: string;
  credentialDeviceType: "singleDevice" | "multiDevice";
  credentialBackedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export function ManagePasskeys() {
  const { session } = useAuth();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch passkeys on mount
  useEffect(() => {
    if (session) {
      fetchPasskeys();
    }
  }, [session]);

  const fetchPasskeys = async () => {
    if (!session) return;

    try {
      const res = await fetch("/api/passkey/manage", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load passkeys");
      }

      const data = await res.json();
      setPasskeys(data.passkeys);
    } catch (err: any) {
      logger.error("[ManagePasskeys] Fetch error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (passkey: Passkey) => {
    setEditingId(passkey.id);
    setEditingName(passkey.friendlyName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (passkeyId: string) => {
    if (!editingName.trim() || !session) {
      return;
    }

    try {
      const res = await fetch("/api/passkey/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          passkeyId,
          friendlyName: editingName.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update passkey name");
      }

      // Update local state
      setPasskeys((prev) =>
        prev.map((pk) =>
          pk.id === passkeyId
            ? { ...pk, friendlyName: editingName.trim() }
            : pk
        )
      );

      setEditingId(null);
      setEditingName("");
    } catch (err: any) {
      logger.error("[ManagePasskeys] Update error:", err.message);
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || !session) return;

    try {
      const res = await fetch("/api/passkey/manage", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ passkeyId: deletingId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete passkey");
      }

      // Remove from local state
      setPasskeys((prev) => prev.filter((pk) => pk.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      logger.error("[ManagePasskeys] Delete error:", err.message);
      setError(err.message);
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
        {error}
      </div>
    );
  }

  if (passkeys.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Fingerprint className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-base text-gray-600 mb-1">No passkeys set up yet</p>
        <p className="text-sm text-gray-500">
          Set up a passkey for faster, more secure sign-in
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {passkeys.map((passkey) => (
        <div
          key={passkey.id}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editingId === passkey.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(passkey.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSaveEdit(passkey.id)}
                  className="h-9 px-2"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-9 px-2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {passkey.friendlyName}
                  </p>
                  {passkey.credentialBackedUp && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Synced
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Added {formatDate(passkey.createdAt)}</span>
                  {passkey.lastUsedAt && (
                    <span>Last used {formatDate(passkey.lastUsedAt)}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {editingId !== passkey.id && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartEdit(passkey)}
                className="h-9 px-2"
              >
                <Edit2 className="w-4 h-4 text-gray-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeletingId(passkey.id)}
                className="h-9 px-2 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this passkey?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You won't be able to use this passkey to sign in anymore.
              {passkeys.length === 1 && (
                <span className="block mt-2 font-medium text-amber-700">
                  This is your only passkey. You'll need to use your email and
                  password to sign in.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Passkey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
