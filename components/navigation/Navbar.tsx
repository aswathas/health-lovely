"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Activity,
  FileText,
  Calendar,
  Settings,
  User,
  LogOut,
  Stethoscope,
  LineChart,
  Clock,
  Database,
  Brain, // Import Database icon instead of Heart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { Chat } from "groq-sdk/resources/index.mjs";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Doctor Visits", href: "/doctor-visits", icon: Stethoscope },
  { name: "Recovery & Backup", href: "/recovery", icon: Database },
  { name: "AI Chat", href: "/doctor-visits/chat", icon: Brain }, // Updated name and icon
  { name: "Reports", href: "/reports", icon: LineChart },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
      showToast.success("Signed out successfully");
    } catch (error) {
      showToast.error("Error signing out");
    }
  };

  return (
    <nav className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold">Lovely</span>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className="absolute bottom-8 left-4 right-4">
        {user ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-gray-500">Health Warrior</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="w-full flex items-center gap-2 justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
