"use client";

import React, { useState } from "react";
import { Star, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

export default function SubmitTestimonialClient({ order, clientName }: { order: any; clientName: string }) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [ratingQuality, setRatingQuality] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const getProjectName = () => {
    try {
      const fd = typeof order.form_data === 'string' ? JSON.parse(order.form_data) : (order.form_data || {});
      const baseTitle = order.store_services?.title || order.store_products?.title;
      const pkg = typeof order.selected_package === "string" ? JSON.parse(order.selected_package) : (order.selected_package || {});
      const pkgName = pkg?.name || "";
      const projectNote = fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
      
      if (baseTitle && projectNote) return `${baseTitle} — ${projectNote}`;
      if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
      if (baseTitle) return baseTitle;
      if (pkgName && projectNote) return `${pkgName} — ${projectNote}`;
      return pkgName || fd.customer_name || "Project";
    } catch (e) {
      return order.store_services?.title || order.store_products?.title || "Project";
    }
  };

  const submitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("store_testimonials").insert({
        order_id: order.id,
        user_id: null,
        client_name: clientName,
        rating_quality: ratingQuality,
        rating_communication: ratingCommunication,
        rating_speed: ratingSpeed,
        comment: comment.trim()
      });

      if (error) throw error;
      showToast("Thank you for your feedback!", "success");
      setSuccess(true);
    } catch (err: any) {
      showToast(err.message || "Failed to submit testimonial", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-100 mx-auto transform transition-all">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-sm shadow-emerald-200">
           <PartyPopper className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
        <p className="text-slate-500 mb-6">Your testimonial means a lot to our growth.</p>
        <Link href="/" className="inline-block bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-secondary transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submitTestimonial} className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
      
      <div className="text-center mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
         <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Project Information</h4>
         <p className="text-lg font-bold text-slate-900">{getProjectName()}</p>
         <p className="text-xs text-slate-400 mt-1">Order #{order.order_number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
         {[
           { label: "Work Quality", state: ratingQuality, setter: setRatingQuality },
           { label: "Communication Response", state: ratingCommunication, setter: setRatingCommunication },
           { label: "Work Speed", state: ratingSpeed, setter: setRatingSpeed }
         ].map((item, i) => (
           <div key={i} className="flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">{item.label}</span>
              <div className="flex gap-1 bg-slate-50 p-2 rounded-xl">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button 
                     key={star} 
                     type="button"
                     onClick={() => item.setter(star)}
                     className="transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                   >
                      <Star className={`w-7 h-7 sm:w-6 sm:h-6 drop-shadow-sm ${star <= item.state ? 'fill-yellow-400 text-yellow-500' : 'text-slate-200'}`} />
                   </button>
                 ))}
              </div>
           </div>
         ))}
      </div>

      <div className="relative mb-6">
         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Leave a Message / Comment</label>
         <textarea 
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write your experience or feedback here... (e.g., The design result is awesome!)"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium min-h-[140px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none leading-relaxed"
            required
         />
      </div>

      <button 
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-secondary transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PartyPopper className="w-5 h-5" />}
        Submit Testimonial & Complete
      </button>
      
      <p className="text-center text-[10px] font-medium text-slate-400 mt-5">
        By clicking submit, you agree to provide an honest testimonial to be displayed on Kangjasa.
      </p>
    </form>
  );
}
