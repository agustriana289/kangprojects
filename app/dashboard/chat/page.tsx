import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserChatClient from "./UserChatClient";
import AdminChatListClient from "./AdminChatListClient";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ new_chat?: string }> }) {
  const { new_chat } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    if (new_chat) {
      // Create or find existing admin chat for this new_chat (user_id)
      const { data: existingChat } = await supabase.from("admin_chats").select("id").eq("user_id", new_chat).maybeSingle();
      if (existingChat?.id) {
        redirect(`/dashboard/chat/${existingChat.id}`);
      } else {
        const { data: newChat } = await supabase.from("admin_chats").insert({ user_id: new_chat }).select("id").single();
        if (newChat?.id) {
          redirect(`/dashboard/chat/${newChat.id}`);
        }
      }
    }
    return <AdminChatListClient />;
  }

  return <UserChatClient user={user} profile={profile} />;
}