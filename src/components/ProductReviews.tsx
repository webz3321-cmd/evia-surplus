import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Star, Camera, Send, User, Clock, Image as ImageIcon, X, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: any;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsList);
      setLoading(false);
    }, (error) => {
      console.error("Reviews snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Limit size to ~2MB for processing, though we'll compress it further
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image is too large. Please select a file under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to quality compressed JPEG Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        
        // Final check: Firestore doc limit is 1MB. 
        // Base64 is ~33% larger than binary. 
        // 500 characters of Base64 is roughly 375 bytes.
        // So a 700KB Base64 string is safe.
        if (dataUrl.length > 800000) {
          toast.error('Compressed image still exceeds limit. Try a smaller file.');
          return;
        }
        
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.id,
        userName: user.name || 'Anonymous User',
        rating,
        comment: comment.trim(),
        imageUrl: imageUrl.trim() || null,
        createdAt: Timestamp.now()
      });
      
      toast.success('Feedback shared. Thank you!');
      setComment('');
      setImageUrl('');
      setRating(5);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-16 border-t border-border pt-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A38A5F]">Voice of community</span>
          <h2 className="mt-2 font-display text-4xl text-foreground lowercase">customer<span className="text-muted-foreground/30">.</span>feedback</h2>
          
          <div className="flex items-center gap-4 mt-4">
             <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
               <span className="text-lg font-black text-emerald-700">{averageRating}</span>
               <Star size={14} className="fill-emerald-600 text-emerald-600" />
             </div>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{reviews.length} Certified Reviews</p>
          </div>
        </div>

        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="h-12 px-8 rounded-full bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Camera size={14} />
            Share Your Experience
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handleSubmit} className="bg-surface border border-border/50 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest">Rate this piece</h3>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star 
                      size={32} 
                      className={`${s <= rating ? 'fill-[#A38A5F] text-[#A38A5F]' : 'text-muted-foreground/30'}`} 
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#A38A5F] ml-1">Review Protocol</label>
                  <textarea
                    required
                    placeholder="Tell us about the fit, quality, and feel..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full h-32 px-6 py-4 bg-background border border-border rounded-2xl text-xs font-medium focus:border-[#A38A5F] outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#A38A5F] ml-1">Photo Attachment</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  {imageUrl ? (
                    <div className="relative group aspect-square max-w-[200px] rounded-2xl overflow-hidden border border-border">
                      <img src={imageUrl} alt="Review attachment" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-10 border-2 border-dashed border-border rounded-2xl hover:border-[#A38A5F]/40 hover:bg-[#A38A5F]/5 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground group"
                    >
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest">Click to upload photo</p>
                        <p className="text-[9px] uppercase tracking-tighter mt-1 opacity-60">PNG, JPG up to 2MB</p>
                      </div>
                    </button>
                  )}
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest ml-1 mt-2">Note: Professional visuals preferred for community gallery</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-15 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {loading ? null : reviews.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-3xl">
             <User size={32} className="mx-auto text-muted-foreground/30 mb-4" />
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Be the first to archive a review</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {reviews.map((review) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={review.id} 
                className="bg-surface/30 border border-border/40 p-6 rounded-[32px] hover:border-[#A38A5F]/20 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A38A5F]/10 flex items-center justify-center border border-[#A38A5F]/20">
                      <User size={16} className="text-[#A38A5F]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{review.userName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-muted-foreground" />
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                          {review.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/50">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={10} 
                        className={`${s <= review.rating ? 'fill-emerald-600 text-emerald-600' : 'text-stone-300'}`} 
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground font-light mb-4">
                  "{review.comment}"
                </p>

                {review.imageUrl && (
                  <button 
                    onClick={() => setSelectedImage(review.imageUrl!)}
                    className="relative mt-4 w-20 h-20 rounded-xl overflow-hidden border border-border group-hover:border-[#A38A5F]/40 transition-all hover:scale-105 active:scale-95"
                  >
                    <img 
                      src={review.imageUrl} 
                      alt="Customer review" 
                      className="w-full h-full object-cover transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon size={14} className="text-white drop-shadow-md" />
                    </div>
                  </button>
                )}

                <div className="mt-5 pt-4 border-t border-border/20 flex items-center justify-between">
                  <button className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#A38A5F] hover:underline">
                    Helpful?
                  </button>
                  <button className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 hover:opacity-100 transition-opacity">
                    Report
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          >
            <motion.button 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </motion.button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Product review full size" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
