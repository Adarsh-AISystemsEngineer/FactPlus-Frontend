import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import { chatService, claimService } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  User,
  ArrowLeft,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, deleteAccount, updateUserProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [showDeleteChats, setShowDeleteChats] = useState(false);
  const [showClearData, setShowClearData] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(displayName.trim());
      setUpdateSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      await chatService.deleteAllUserChats(user.uid);
      toast.success("All chats deleted successfully");
      setShowDeleteChats(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete chats");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      // Delete all chats and claims
      await Promise.all([
        chatService.deleteAllUserChats(user.uid),
        claimService.deleteAllUserClaims(user.uid),
      ]);
      toast.success("All data cleared successfully");
      setShowClearData(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to clear data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      toast.error("Please enter your password to confirm account deletion");
      return;
    }

    try {
      setLoading(true);
      await deleteAccount(deleteAccountPassword);
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setLoading(false);
      setDeleteAccountPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Navigation */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-background/50 backdrop-blur-sm">
        <Link href="/chat" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings', active: true }
          ]}
        />
      </header>

      {/* Settings Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account, privacy, and preferences
          </p>
        </div>

        <Tabs defaultValue="user" className="max-w-2xl">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="user" className="gap-2">
              <User className="w-4 h-4" />
              User Settings
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              Privacy & Data
            </TabsTrigger>
          </TabsList>

          {/* User Settings Tab */}
          <TabsContent value="user" className="space-y-6">
            <Card className="border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Profile Settings
              </h2>

              {/* Display Name */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-2 bg-white/5 border-white/10 text-white cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName" className="text-muted-foreground">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your preferred name"
                    className="mt-2 bg-white/5 border-white/10 text-white focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This name is used throughout the application
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {updateSuccess && (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Chat Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Auto-save Messages
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Automatically save your messages to history
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Show Chat History
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Display previous conversations in the chat view
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Enable Notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications for analysis completions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Data Management
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setShowDeleteChats(true)}
                  className="w-full text-left p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                        Delete All Chats
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permanently remove all conversation history
                      </p>
                    </div>
                    <Trash2 className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                <button
                  onClick={() => setShowClearData(true)}
                  className="w-full text-left p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                        Clear All Data
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Delete all chats, claims, and analysis results
                      </p>
                    </div>
                    <Trash2 className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>
            </Card>

            <Card className="border-red-500/30 bg-red-500/5 p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-4">
                Danger Zone
              </h2>

              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full text-left p-4 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
                      Delete Account
                    </p>
                    <p className="text-xs text-red-400/60 mt-1">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
              </button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Chats Dialog */}
      <AlertDialog open={showDeleteChats} onOpenChange={setShowDeleteChats}>
        <AlertDialogContent className="border-white/10 bg-background/95 backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete All Chats?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your conversation history will
              be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-sm text-red-400">
              ⚠️ This will delete all chats but keep your analysis claims
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllChats}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All Chats"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Data Dialog */}
      <AlertDialog open={showClearData} onOpenChange={setShowClearData}>
        <AlertDialogContent className="border-white/10 bg-background/95 backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your chats, claims, and analysis
              results will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-sm text-red-400">
              ⚠️ This will delete everything - proceed with caution
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear All Data"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent className="border-white/10 bg-background/95 backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. Your account and all
              associated data will be deleted forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-sm text-red-400">
                ⚠️ Please enter your password to confirm
              </p>
            </div>
            <Input
              type="password"
              placeholder="Enter your password"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:border-red-500/50"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loading || !deleteAccountPassword}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
