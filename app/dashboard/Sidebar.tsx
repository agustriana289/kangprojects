"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, ShoppingBag,
  Ticket, Tags, Megaphone,
  Users, LayoutTemplate, BriefcaseBusiness, BookOpen, Tv2, Star, Images, HelpCircle, MessageSquare, PercentCircle, Mail, ListTodo
} from "lucide-react";

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const adminMenu = [
    { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proyek", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Layanan", href: "/dashboard/services", icon: BriefcaseBusiness },
    { name: "Toko", href: "/dashboard/shop", icon: ShoppingBag },
    { name: "Diskon", href: "/dashboard/discounts", icon: Tags },
    { name: "Pengumuman", href: "/dashboard/announcements", icon: Megaphone },
    { name: "Tiket Dukungan", href: "/dashboard/tickets", icon: Ticket },
    { name: "Portofolio", href: "/dashboard/portfolios", icon: Images },
    { name: "Testimoni", href: "/dashboard/testimonials", icon: Star },
    { name: "Blog", href: "/dashboard/blogs", icon: BookOpen },
    { name: "Promo", href: "/dashboard/promos", icon: PercentCircle },
    { name: "Iklan", href: "/dashboard/ads", icon: Tv2 },
    { name: "Halaman", href: "/dashboard/pages", icon: LayoutTemplate },
    { name: "FAQ", href: "/dashboard/faq", icon: HelpCircle },
    { name: "Email", href: "/dashboard/settings/email", icon: Mail },
    { name: "TickTick", href: "/dashboard/settings/ticktick", icon: ListTodo },
    { name: "Pengguna", href: "/dashboard/user", icon: Users },
  ];

  const userMenu = [
    { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proyek Saya", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Telusuri Toko", href: "/dashboard/browse-shop", icon: ShoppingBag },
    { name: "Diskon", href: "/dashboard/vouchers", icon: Tags },
    { name: "Postingan Terbaru", href: "/dashboard/latest-posts", icon: BookOpen },
    { name: "Jelajahi Halaman", href: "/dashboard/user-pages", icon: LayoutTemplate },
    { name: "Bantuan & FAQ", href: "/dashboard/help-faq", icon: HelpCircle },
    { name: "Chat dengan Admin", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Tiket Dukungan", href: "/dashboard/tickets", icon: Ticket },
  ];

  const menus = isAdmin ? adminMenu : userMenu;


  return (
    <>
      <aside 
        id="sidebar" 
        className="fixed hidden z-20 h-full top-0 left-0 pt-16 lg:flex shrink-0 flex-col w-64 transition-width duration-75" 
        aria-label="Sidebar"
      >
        <div className="relative flex-1 flex flex-col min-h-0 border-r border-slate-200 bg-white pt-0">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-hidden px-4">
            <div className="flex-1 bg-white space-y-4">
              <ul className="space-y-1 pb-2">
                {menus.map((item) => {
                  const isActive = item.href !== "#" && (
                    item.href === "/dashboard" 
                      ? pathname === "/dashboard" 
                      : (pathname === item.href || pathname.startsWith(item.href + "/"))
                  );
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`text-sm font-bold rounded-xl flex items-center p-3 group transition-all duration-200 ${
                          isActive 
                            ? "bg-indigo-50 text-primary pointer-events-none ring-1 ring-indigo-100 shadow-sm" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 transition duration-75 ${
                          isActive 
                            ? "text-primary" 
                            : "text-slate-400 group-hover:text-slate-600"
                        }`} />
                        <span className="ml-3 flex-1 whitespace-nowrap">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </aside>
      <div className="bg-slate-900/50 backdrop-blur-sm hidden fixed inset-0 z-10 transition-opacity" id="sidebarBackdrop"></div>
    </>
  );
}