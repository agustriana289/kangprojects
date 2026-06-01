import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NotionSettingsClient from "./NotionSettingsClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Integrasi Notion",
  description: "Hubungkan Notion untuk sinkronisasi project dan market secara otomatis",
};

export default async function NotionSettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", authData.user.id)
    .single();

  if (!currentUser?.is_admin) redirect("/dashboard");

  return (
    <div className="pt-6 px-4 pb-12 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Integrasi Notion</h1>
        <p className="text-sm font-medium text-slate-500">
          Sinkronisasi project dan data manajemen ke Notion secara otomatis.
        </p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <NotionSettingsClient />
      </Suspense>
    </div>
  );
}
