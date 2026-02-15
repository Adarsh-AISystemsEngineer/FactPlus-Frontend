
import { Link } from "wouter";
import logoImage from "@assets/generated_images/futuristic_data-node_eye_logo_for_factplus.png";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { LogOut, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
      console.error("Logout error:", error);
    }
  };
  return (
    <nav className="w-full border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-primary/50 group-hover:ring-primary transition-all shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]">
            <img src={logoImage} alt="FactPlus Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Fact<span className="text-primary">Plus</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.displayName?.split(" ")[0] || "User"}
              </span>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                  Log In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}