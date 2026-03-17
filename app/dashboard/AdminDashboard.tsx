import { Wallet, TrendingUp, Users, Ticket, Clock, Box } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/admin/Avatar";
import { createClient } from "@/utils/supabase/server";
import { getTimeAgo } from "@/utils/dateFormatter";
import YearFilter from "./YearFilter";

export default async function AdminDashboard({
  name,
  yearParam,
}: {
  name: string;
  yearParam?: string;
}) {
  const supabase = await createClient();

  // Fetch count of all non-admin clients
  const { count: totalClientsCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", false);

  // Fetch recent 5 clients
  const { data: recentClients } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url")
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch all recent timeline activities across platform (Admin can see all)
  const { data: timelineData } = await supabase
    .from("user_activities")
    .select("*, users (full_name, email)")
    .order("created_at", { ascending: false })
    .limit(10);
  const adminActivities = timelineData || [];

  // Fetch real orders
  const { data: allOrders } = await supabase
    .from("store_orders")
    .select(
      `
      id,
      order_number,
      status,
      total_amount,
      form_data,
      selected_package,
      created_at,
      user_id,
      service_id,
      product_id,
      store_services ( title, category ),
      store_products ( title, category )
    `,
    )
    .order("created_at", { ascending: false });

  // Fetch all users for client name mapping
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name, email");
  const userMap: Record<string, { full_name?: string; email?: string }> = {};
  (allUsers || []).forEach((u: any) => {
    userMap[u.id] = u;
  });
  const orders = allOrders || [];
  const completedOrders = orders.filter((o) =>
    ["paid", "processing", "completed"].includes(o.status),
  );
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );

  // Calculate Best Seller
  const serviceCounts: Record<string, number> = {};
  const productCounts: Record<string, number> = {};
  let bestSellerName = "Tidak ada";
  let bestSellerCount = 0;

  orders.forEach((o) => {
    if (o.service_id) {
      serviceCounts[o.service_id] = (serviceCounts[o.service_id] || 0) + 1;
      if (serviceCounts[o.service_id] > bestSellerCount) {
        bestSellerCount = serviceCounts[o.service_id];
        bestSellerName = (o.store_services as any)?.title || "Layanan Agensi";
      }
    }
    if (o.product_id) {
      productCounts[o.product_id] = (productCounts[o.product_id] || 0) + 1;
      if (productCounts[o.product_id] > bestSellerCount) {
        bestSellerCount = productCounts[o.product_id];
        bestSellerName = (o.store_products as any)?.title || "Item Toko";
      }
    }
  });
  const recentOrdersList = orders.slice(0, 5);

  // Fetch open tickets count
  const { data: latestTickets, count: openTicketsCount } = await supabase
    .from("support_tickets")
    .select("subject, users(full_name, email)", { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);

  let latestTicketText = "Tidak ada tiket terbuka";
  if (latestTickets && latestTickets.length > 0) {
    const t = latestTickets[0];
    const userRef = t.users as any;
    const authorName =
      userRef?.full_name ||
      (userRef?.email ? userRef.email.split("@")[0] : "Tanpa Nama");
    latestTicketText = `${t.subject} dari ${authorName}`;
  }

  const latestClientText =
    recentClients && recentClients.length > 0
      ? `Klien Baru: ${recentClients[0].full_name || recentClients[0].email.split("@")[0]}`
      : "Belum ada klien";

  const { data: portfolios } = await supabase
    .from("store_portfolios")
    .select("id, title, images, slug")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch services with order counts
  const { data: services } = await supabase
    .from("store_services")
    .select("id, title, category, slug");

  const serviceSales = ((services as Record<string, unknown>[]) || [])
    .map((s) => ({
      name: s.title as string,
      cat: s.category as string,
      slug: s.slug as string,
      sold: orders.filter((o: any) => o.store_services?.title === s.title).length,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const { data: products } = await supabase
    .from("store_products")
    .select("id, title, category, slug");

  const productSales = ((products as Record<string, unknown>[]) || [])
    .map((p) => ({
      name: p.title as string,
      cat: p.category as string,
      slug: p.slug as string,
      sold: orders.filter((o: any) => o.store_products?.title === p.title).length,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Monthly Revenue Data (All time by Year)
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let y = currentYear; y >= 2023; y--) {
    availableYears.push(y);
  }

  // We'll calculate the stats for the first available year (latest)
  const displayYear = yearParam ? parseInt(yearParam) : currentYear;

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const month = i;
    const revenue = completedOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === displayYear && d.getMonth() === month;
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      month: new Date(displayYear, month).toLocaleString("id-ID", {
        month: "short",
      }),
      value: revenue,
    };
  });

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);
  const currentMonthRevenue =
    monthlyRevenue.find(
      (m) =>
        m.month === new Date().toLocaleString("id-ID", { month: "short" }),
    )?.value || 0;

  const getFormData = (o: any) => {
    try {
      return typeof o.form_data === "string"
        ? JSON.parse(o.form_data)
        : o.form_data || {};
    } catch {
      return {};
    }
  };

  const getProjectTitle = (o: any) => {
    const fd = getFormData(o) || {};
    const projectNote = fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
    if (projectNote) return projectNote;

    const baseTitle = o.store_services?.title || o.store_products?.title || o.custom_item_name || fd.custom_item_name || "";
    let pkgName = "";
    try {
      if (typeof o.selected_package === "string") {
        try { pkgName = JSON.parse(o.selected_package)?.name || ""; } catch { pkgName = o.selected_package; }
      } else {
        pkgName = o.selected_package?.name || "";
      }
    } catch { /* ignore */ }
    
    if (!pkgName) pkgName = o.custom_package_name || fd.custom_package_name || "";

    if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
    if (baseTitle) return baseTitle;
    if (pkgName) return pkgName;
    return fd.customer_name || "Proyek";
  };

  const getClientName = (o: any) => {
    const u = userMap[o.user_id];
    if (u?.full_name) return u.full_name;
    if (u?.email) return u.email.split("@")[0];
    const fd = getFormData(o);
    return (
      fd.customer_name || fd["Client Name"] || fd["Nama"] || "Klien Offline"
    );
  };

  return (
    <div className="pt-6 px-4">
      

      <div className="w-full bg-linear-to-r from-primary to-primary rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-lg shadow-indigo-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Selamat pagi, {name || "Admin"}
          </h1>
          <p className="text-sm font-medium text-slate-200">
            Inilah yang terjadi dengan agensi Anda hari ini.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "Total Pendapatan",
              value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
              tag: `↗ ${completedOrders.length} pesanan`,
              icon: Wallet,
            },
            {
              title: "Terlaris",
              value: bestSellerName,
              tag: `↗ ${bestSellerCount} Terjual`,
              icon: TrendingUp,
            },
            {
              title: "Total Klien",
              value: totalClientsCount?.toString() || "0",
              tag: latestClientText,
              icon: Users,
            },
            {
              title: "Tiket Dukungan",
              value: openTicketsCount?.toString() || "0",
              tag: latestTicketText,
              icon: Ticket,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 ring-1 ring-white/20 transition-all hover:bg-white/20"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-200">
                <stat.icon className="w-4 h-4" />
                <h3 className="text-sm font-medium">{stat.title}</h3>
              </div>
              <span className="text-2xl font-bold text-white block mb-2">
                {stat.value}
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                {stat.tag}
              </p>
            </div>
          ))}
        </div>
      </div>

      

      <div className="w-full grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 2xl:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Laporan Pendapatan
            </h3>
            <div className="flex items-center gap-3">
              <YearFilter
                availableYears={availableYears}
                displayYear={displayYear}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 sm:gap-12 flex-1 pb-4">
            

            <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col justify-center shrink-0">
              <div className="mb-8">
                <span className="text-2xl font-bold text-slate-900 block mb-1">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Total penghasilan
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-indigo-300 rounded-[2px]"></div>
                  <span className="text-sm font-medium text-slate-500">
                    Penghasilan bulan ini
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  Rp {currentMonthRevenue.toLocaleString("id-ID")}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-secondary rounded-[2px]"></div>
                  <span className="text-sm font-medium text-slate-500">
                    Pengeluaran terlacak
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  Rp 0
                </span>
              </div>
            </div>

            

            <div className="w-full md:w-2/3 xl:w-3/4 flex items-end justify-between h-56 sm:h-[280px] relative mt-4 md:mt-0">
              {monthlyRevenue.map((data, idx) => {
                const percentage = (data.value / maxRevenue) * 100;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-end h-full w-full group relative cursor-crosshair"
                  >
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                      {data.month}: Rp {data.value.toLocaleString("id-ID")}
                    </div>

                    <div className="w-1.5 sm:w-2 overflow-hidden flex flex-col h-[90%] bg-transparent justify-end">
                      <div
                        style={{ height: `${percentage}%` }}
                        className="w-full bg-primary transition-all duration-500 group-hover:bg-secondary group-hover:scale-x-110 rounded-t-sm"
                      ></div>
                    </div>

                    <span className="absolute -bottom-7 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900 transition-colors">
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Galeri Portofolio
            </h3>
            <Link href="/portfolios" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {portfolios?.length === 0 ? (
              <div className="col-span-2 h-40 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                Tidak ada portofolio yang dipublikasikan
              </div>
            ) : (
              portfolios?.map((p) => (
                <Link
                  key={p.id}
                  href={`/portfolios/${p.slug || p.id}`}
                  target="_blank"
                  className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-video relative group block"
                >
                  <img
                    src={
                      p.images?.[0] ||
                      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80"
                    }
                    alt={p.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Klien Terbaru
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total {totalClientsCount || 0}
              </span>
            </div>
            <div className="flex -space-x-3">
              {recentClients?.map((client) => {
                return (
                  <Link
                    key={client.id}
                    href={`/dashboard/user/${client.id}`}
                    className="h-10 w-10 rounded-full border-[3px] border-white bg-indigo-100 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-primary shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden"
                    title={client.full_name || client.email}
                  >
                    <Avatar
                      url={client.avatar_url}
                      name={client.full_name || client.email || "U"}
                      imageClassName="w-full h-full object-cover"
                      fallbackClassName="w-full h-full flex items-center justify-center"
                    />
                  </Link>
                );
              })}
              <Link
                href="/dashboard/user"
                className="h-10 w-10 rounded-full border-[3px] border-white bg-slate-50 border-dashed flex items-center justify-center text-slate-400 hover:z-10 hover:text-primary hover:border-indigo-100 transition-colors cursor-pointer relative"
                title="Lihat Semua Pengguna"
              >
                <Users size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 xl:gap-4 my-4">
        

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl mb-4 p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Layanan Tersedia
              </h3>
              <span className="text-sm font-medium text-slate-500">
                Penawaran utama agensi
              </span>
            </div>
            <Link href="/services" target="_blank" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
              Lihat semua
            </Link>
          </div>
          <div className="flow-root mt-8">
            <ul role="list" className="divide-y divide-slate-100">
              {serviceSales.length === 0 ? (
                <li className="py-4 text-center text-xs font-bold text-slate-400 italic">
                  Belum ada layanan yang dibuat.
                </li>
              ) : (
                serviceSales.map((s, i) => (
                  <li key={i}>
                    <Link
                      href={s.slug ? `/services/${s.slug}` : "/services"}
                      target="_blank"
                      className="flex items-center justify-between py-3 sm:py-4 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                          {s.cat}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center text-xs font-bold uppercase tracking-wider ${s.sold > 0 ? "text-amber-500" : "text-slate-400"}`}
                      >
                        {s.sold} Pesanan
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl mb-4 p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Produk Toko
              </h3>
              <span className="text-sm font-medium text-slate-500">
                Aset & inventaris toko
              </span>
            </div>
            <Link href="/shop" target="_blank" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
              Lihat semua
            </Link>
          </div>
          <div className="flow-root mt-8">
            <ul role="list" className="divide-y divide-slate-100">
              {productSales.length === 0 ? (
                <li className="py-4 text-center text-xs font-bold text-slate-400 italic">
                  Belum ada produk yang dibuat.
                </li>
              ) : (
                productSales.map((s, i) => (
                  <li key={i}>
                    <Link
                      href={s.slug ? `/shop/${s.slug}` : "/shop"}
                      target="_blank"
                      className="flex items-center space-x-4 py-3 sm:py-4 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-xl"
                    >
                      <div className="shrink-0">
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2.5 shadow-sm text-slate-400">
                          <Box size={20} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                          {s.cat}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                        {s.sold} Terjual
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 my-4">
        

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 2xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Proyek terbaru
              </h3>
              <span className="text-sm font-medium text-slate-500">
                Daftar semua pekerjaan terbaru
              </span>
            </div>
          </div>

          <div className="flex flex-col mt-4">
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
              <div className="align-middle inline-block min-w-full">
                <div className="shadow-none overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Referensi Pesanan
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Produk / Layanan
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Jumlah
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Tanggal
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Ruang Kerja
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 border-t border-slate-200">
                      {recentOrdersList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 italic text-center py-12"
                          >
                            Belum ada pesanan yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        recentOrdersList.map((order: any, i: number) => {
                          const itemName = getProjectTitle(order);
                          const itemCat = getClientName(order);

                          const statusColors: Record<string, string> = {
                            pending:
                              "bg-amber-50 text-amber-700 border-amber-100",
                            waiting_payment:
                              "bg-yellow-50 text-yellow-700 border-yellow-100",
                            paid: "bg-indigo-50 text-primary border-indigo-100",
                            processing:
                              "bg-blue-50 text-blue-700 border-blue-100",
                            completed:
                              "bg-emerald-50 text-emerald-700 border-emerald-100",
                            cancelled: "bg-red-50 text-red-700 border-red-100",
                          };
                          const statusColor =
                            statusColors[order.status] ||
                            "bg-slate-50 text-slate-500 border-slate-100";

                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-700 text-left">
                                #
                                {order.order_number ||
                                  order.id.split("-")[0].toUpperCase()}
                              </td>
                              <td className="p-4 whitespace-nowrap text-left">
                                <div className="text-sm font-bold text-slate-900">
                                  {itemName}
                                </div>
                                <div className="text-sm font-medium text-slate-500 mt-0.5">
                                  {itemCat}
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-900 text-left">
                                Rp{" "}
                                {Number(order.total_amount || 0).toLocaleString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap text-left">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm border ${statusColor}`}
                                >
                                  {order.status.replace("_", " ").replace("pending", "menunggu").replace("waiting payment", "menunggu pembayaran").replace("paid", "dibayar").replace("processing", "diproses").replace("completed", "selesai").replace("cancelled", "dibatalkan")}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 text-right">
                                {new Date(order.created_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap text-right">
                                <Link
                                  href={`/workspace/${order.id}`}
                                  className="text-primary hover:text-primary bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg inline-flex items-center transition-colors shadow-sm"
                                  title="Buka Ruang Kerja"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                    />
                                  </svg>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 border-b border-slate-100 pb-4">
            Timeline Aktivitas
          </h3>
          <div className="flow-root">
            <ul className="relative border-l border-slate-200 ml-3">
              {adminActivities.length > 0 ? (
                adminActivities.map((act) => (
                  <li key={act.id} className="mb-7 ml-6 relative last:mb-0">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200 rounded-full -left-[37px] ring-4 ring-white shadow-sm">
                      <Clock className="w-3 h-3 text-slate-400" />
                    </span>
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed pt-0.5">
                        <span className="font-bold text-slate-900">
                          {act.users?.full_name || act.users?.email || "Seorang pengguna"}
                        </span>{" "}
                        {act.title?.replace('Service request submitted for', 'Permintaan layanan dikirim untuk').replace('Product purchase submitted for', 'Pembelian produk dikirim untuk')}{" "}
                        {act.highlight && (
                          <span
                            className={`font-bold ${act.highlight_color || "text-slate-900"}`}
                          >
                            {act.highlight}
                          </span>
                        )}
                      </p>
                      <time className="text-xs font-medium whitespace-nowrap text-slate-400 pt-1 tracking-wide">
                        {getTimeAgo(act.created_at)}
                      </time>
                    </div>
                  </li>
                ))
              ) : (
                <li className="mb-7 ml-6 relative text-sm text-slate-500 font-medium">
                  Tidak ada aktivitas terbaru di platform.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}