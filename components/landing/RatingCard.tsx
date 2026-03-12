import FadeIn from "./FadeIn";
import { Star } from "lucide-react";

interface RatingCardProps {
  avgRating: number;
  totalPortfolios: number;
  recentUsers: { id: string; full_name: string | null; email: string | null; avatar_url: string | null }[];
  settings?: any;
}

export default function RatingCard({ avgRating, totalPortfolios, recentUsers }: RatingCardProps) {
  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : "5.0";

  const avatarUsers = recentUsers.slice(0, 4);
  const extraCount = recentUsers.length > 4 ? recentUsers.length - 4 : 0;

  return (
    <section className="py-10 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={200} className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 shrink-0">
              {avatarUsers.map((user) => (
                user.avatar_url ? (
                  <img
                    key={user.id}
                    src={user.avatar_url}
                    alt={user.full_name || user.email || "User"}
                    className="w-11 h-11 rounded-full border-4 border-white object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    key={user.id}
                    className="w-11 h-11 rounded-full border-4 border-white bg-indigo-100 text-primary flex items-center justify-center text-sm font-bold shrink-0"
                  >
                    {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )
              ))}
              {extraCount > 0 && (
                <div className="w-11 h-11 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                  +{extraCount}
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-slate-500 leading-tight">
              <span className="font-bold text-slate-800 block">{totalPortfolios > 0 ? `${totalPortfolios.toLocaleString("id-ID")}+` : "500+"}</span>
              klien bergabung
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-slate-200 shrink-0" />

          <div className="flex items-center gap-3">
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-900">{displayRating}/5</span> rata-rata penilaian
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
