import FadeIn from "./FadeIn";
import { Star } from "lucide-react";

export default function RatingCard() {
  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={300} className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
          <div className="flex -space-x-3">
             <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="Client 1" />
             <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" alt="Client 2" />
             <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="Client 3" />
             <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80" alt="Client 4" />
             <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                100+
             </div>
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-900">4.9/5</span> average rating from satisfied clients
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
