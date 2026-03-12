"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import {
  Menu, Grid,
  Settings, ShoppingBag, BriefcaseBusiness,
  Home, BookOpen, Images, LogOut, User as UserIcon, MessageSquare
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ChatNotificationBell from "@/components/dashboard/ChatNotificationBell";
import NotificationBell from "@/components/dashboard/NotificationBell";
import GlobalSearch from "@/components/dashboard/GlobalSearch";

export default function DashboardHeader({ user, profile, settings }: { user: User | null, profile: any, settings: any }) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLElement>(null);
  const supabase = createClient();

  const toggleSidebar = () => {
    setSidebarOpen((prev: boolean) => !prev);
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar && backdrop) {
      const isOpen = sidebar.classList.contains("flex");
      if (isOpen) {
        sidebar.classList.remove("flex");
        sidebar.classList.add("hidden");
        backdrop.classList.add("hidden");
      } else {
        sidebar.classList.add("flex");
        sidebar.classList.remove("hidden");
        backdrop.classList.remove("hidden");
        backdrop.onclick = () => {
          sidebar.classList.remove("flex");
          sidebar.classList.add("hidden");
          backdrop.classList.add("hidden");
          setSidebarOpen(false);
        };
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const isAdmin = profile?.is_admin || false;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed z-30 w-full" ref={dropdownRef}>
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <button
              id="toggleSidebarMobile"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              onClick={toggleSidebar}
              className="lg:hidden mr-2 text-slate-500 hover:text-slate-900 cursor-pointer p-2 hover:bg-slate-100 focus:bg-slate-100 focus:ring-2 focus:ring-slate-200 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="text-2xl font-bold flex items-center lg:ml-2.5">
              {settings?.logo_url ? (
                 <img src={settings.logo_url} alt={settings.website_name || "Logo"} className="h-8 w-auto object-contain" />
              ) : (
                <span className="self-center flex items-center gap-1 whitespace-nowrap text-slate-900">
                  {settings?.website_name ? settings.website_name.substring(0, 4) : "kang"}
                  <span className="text-primary">
                    {settings?.website_name ? settings.website_name.substring(4) : "logo"}
                  </span>
                </span>
              )}
            </Link>
            <div className="flex flex-1 items-center justify-between gap-4">
              

              <GlobalSearch isAdmin={isAdmin} userId={user?.id || ''} />
            </div>
          </div>
          <div className="flex items-center">
            

            <div className="hidden lg:flex items-center">
              <ChatNotificationBell role={isAdmin ? 'admin' : 'user'} userId={user?.id} />
              <NotificationBell role={isAdmin ? 'admin' : 'user'} />

              

              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => toggleDropdown("apps")}
                  className={`text-slate-500 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl mr-4 group transition-colors ${openDropdown === 'apps' ? 'bg-slate-50 text-primary' : ''}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                
                

                {openDropdown === "apps" && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100 overflow-hidden transform opacity-100 scale-100 origin-top-right transition-all">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                      Halaman Publik
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-4">
                      {[
                        { name: "Beranda", icon: Home, href: '/' },
                        { name: "Layanan", icon: BriefcaseBusiness, href: '/services' },
                        { name: "Toko", icon: ShoppingBag, href: '/shop' },
                        { name: "Portofolio", icon: Images, href: '/portfolio' },
                        { name: "Blog", icon: BookOpen, href: '/blog' },
                        { name: "Pengaturan", icon: Settings, href: isAdmin ? '/dashboard/settings' : '#' },
                      ].map((app, i) => (
                        <Link
                          key={i}
                          href={app.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-indigo-50 hover:text-primary cursor-pointer text-slate-500 group transition-colors"
                        >
                          <app.icon className="w-5 h-5 mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-bold">{app.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            

            <div className="relative ml-2 sm:ml-4">
              <div 
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-indigo-600 to-indigo-500 text-sm font-bold text-white cursor-pointer hover:shadow-md transition-shadow ring-2 ring-white shadow-sm border border-indigo-200 ${openDropdown === 'profile' ? 'ring-indigo-100' : ''}`}
                title={profile?.full_name || user?.email}
                onClick={() => toggleDropdown("profile")}
              >
                {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </div>

              

              {openDropdown === "profile" && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 divide-y divide-slate-100 transform opacity-100 scale-100 origin-top-right transition-all">
                  <div className="px-4 py-4 rounded-t-2xl bg-slate-50">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {profile?.full_name || "Pengguna Terverifikasi"}
                    </p>
                    <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <ul className="py-2">
                    <li>
                      <Link href={`/dashboard/user/${user?.id}`} className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        <UserIcon className="w-4 h-4 mr-3 text-slate-400" /> Profil Akun
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/chat" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        <MessageSquare className="w-4 h-4 mr-3 text-slate-400" /> Chat Langsung
                      </Link>
                    </li>
                    {isAdmin && (
                      <li>
                        <Link href="/dashboard/settings" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          <Settings className="w-4 h-4 mr-3 text-slate-400" /> Pengaturan Sistem
                        </Link>
                      </li>
                    )}
                  </ul>
                  <div className="py-2">
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-rose-500" /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </nav>
  );
}