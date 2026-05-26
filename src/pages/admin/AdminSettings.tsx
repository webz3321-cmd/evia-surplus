import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, RotateCcw, Image as ImageIcon, Sparkles, Upload, Grid, Type, Check, Eye, X, Server, Smartphone, Key, Mail, UploadCloud, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export const AVAILABLE_FONTS = [
  { name: 'Instrument Serif', css: '"Instrument Serif", ui-serif, Georgia, serif', import: 'family=Instrument+Serif:ital,wght@0,400;1,400' },
  { name: 'Space Grotesk', css: '"Space Grotesk", sans-serif', import: 'family=Space+Grotesk:wght@400;500;600;700' },
  { name: 'Playfair Display', css: '"Playfair Display", serif', import: 'family=Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { name: 'Syne', css: '"Syne", sans-serif', import: 'family=Syne:wght@400;700;800' },
  { name: 'Bebas Neue', css: '"Bebas Neue", sans-serif', import: 'family=Bebas+Neue' },
  { name: 'Unbounded', css: '"Unbounded", sans-serif', import: 'family=Unbounded:wght@400;700' },
  { name: 'Inter', css: '"Inter", sans-serif', import: 'family=Inter:wght@400;600;800' },
  { name: 'Lora', css: '"Lora", serif', import: 'family=Lora:ital,wght@0,400;0,700;1,400' }
];

export const COLOR_PRESETS = [
  {
    name: 'Evia Classic Oatmeal',
    logoText: 'evia surplus',
    siteBgColor: '#faf8f5',
    heroBgColor: '#f6f3ed',
    accentColor: '#9f3a38',
    textColor: '#1c1c1c',
    headerFont: 'Instrument Serif',
    buttonRadius: '9999px',
    headerTracking: '-0.02em',
    headerUppercase: false
  },
  {
    name: 'Stealth Tactical Range',
    logoText: 'TACTICAL.OPS',
    siteBgColor: '#121212',
    heroBgColor: '#1a1a1a',
    accentColor: '#f97316',
    textColor: '#e4e4e7',
    headerFont: 'Space Grotesk',
    buttonRadius: '12px',
    headerTracking: '0.05em',
    headerUppercase: true
  },
  {
    name: 'Garrison Imperial Khaki',
    logoText: 'garrison issue',
    siteBgColor: '#e3dfd3',
    heroBgColor: '#dad4c4',
    accentColor: '#3f4e2f',
    textColor: '#1a1d16',
    headerFont: 'Lora',
    buttonRadius: '0px',
    headerTracking: '-0.01em',
    headerUppercase: false
  },
  {
    name: 'Aero Combat Shadow',
    logoText: 'AV8R SYSTEM',
    siteBgColor: '#0b0f19',
    heroBgColor: '#141b2d',
    accentColor: '#00f2fe',
    textColor: '#f1f5f9',
    headerFont: 'Unbounded',
    buttonRadius: '8px',
    headerTracking: '-0.03em',
    headerUppercase: true
  },
  {
    name: 'Cosmic Couture',
    logoText: 'EVIA PARIS',
    siteBgColor: '#ffffff',
    heroBgColor: '#f4f4f5',
    accentColor: '#d946ef',
    textColor: '#18181b',
    headerFont: 'Playfair Display',
    buttonRadius: '9999px',
    headerTracking: '0.05em',
    headerUppercase: true
  }
];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Refs for uploads
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const story1Ref = useRef<HTMLInputElement>(null);
  const story2Ref = useRef<HTMLInputElement>(null);
  const promoRef = useRef<HTMLInputElement>(null);

  // Image processing utility
  const processImage = (file: File, maxSize = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type: Must be an image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const result = canvas.toDataURL('image/jpeg', 0.85);
          resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image object'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file source'));
      reader.readAsDataURL(file);
    });
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadId = toast.loading('Synchronizing Visual Data...');
    try {
      const result = await processImage(files[0]);
      setter(result);
      toast.success('Visual Synchronized', { id: loadId });
    } catch (err: any) {
      toast.error(err.message || 'Processing failed', { id: loadId });
    } finally {
      e.target.value = '';
    }
  };

  // Dynamic Theme variables
  const [logoText, setLogoText] = useState('evia surplus');
  const [logoImage, setLogoImage] = useState('');
  const [showTextWithImage, setShowTextWithImage] = useState(true);

  // Hero Section variables
  const [heroTag, setHeroTag] = useState('Sourced & Authenticated · 2026');
  const [heroTitle, setHeroTitle] = useState('Original vintage military surplus.');
  const [heroDesc, setHeroDesc] = useState('We salvage, catalog, and grade rare menswear utility pieces, tactical gear, and cold-weather clothing built to industrial standards. Sourced globally, curated for life.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=900');

  // Brand Story Section (Editorial Spread) variables
  const [brandStoryTag, setBrandStoryTag] = useState('Sourcing Protocol');
  const [brandStoryTitle, setBrandStoryTitle] = useState('Indestructible garments, salvaged for the modern collector.');
  const [brandStoryDesc, setBrandStoryDesc] = useState('Every item in our collection is hand-inspected for physical integrity, original military contract markings, and historical authenticity. We specialize in salvage stock from the 1950s to the 1980s — heavy wools, authentic herringbone denim, and bulletproof military sateen cotton.');
  const [brandStoryImage1, setBrandStoryImage1] = useState('https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=400');
  const [brandStoryImage2, setBrandStoryImage2] = useState('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400');
  const [brandStoryLabel, setBrandStoryLabel] = useState('Verify provenance');
  const [brandStoryProvenanceText, setBrandStoryProvenanceText] = useState('Salvaged Stock Provenance: US Armed Forces (M-65, OG-107), British Commonwealth (Wool Combat), and French Foreign Legion.');

  // Promotional Banner variables
  const [promoActive, setPromoActive] = useState(false);
  const [promoTitle, setPromoTitle] = useState('Special Archive Deployment Offer');
  const [promoSubtitle, setPromoSubtitle] = useState('Acquire select pristine utility items at up to 35% off. Sourced globally, validated for authenticity.');
  const [promoDiscount, setPromoDiscount] = useState(35);
  const [promoCoupon, setPromoCoupon] = useState('ARCHIVE35');
  const [promoImage, setPromoImage] = useState('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200');
  const [promoLink, setPromoLink] = useState('');
  const [promoButtonText, setPromoButtonText] = useState('Claim 35% Discount');
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const [siteBgColor, setSiteBgColor] = useState('#faf8f5');
  const [heroBgColor, setHeroBgColor] = useState('#f6f3ed');
  const [accentColor, setAccentColor] = useState('#9f3a38');
  const [textColor, setTextColor] = useState('#1c1c1c');

  const [headerFont, setHeaderFont] = useState('Instrument Serif');
  const [headerTracking, setHeaderTracking] = useState('-0.02em');
  const [headerUppercase, setHeaderUppercase] = useState(false);
  const [buttonRadius, setButtonRadius] = useState('9999px');

  // OTP Channel Gateways
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('"EVIA Authentic" <noreply@gmail.com>');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('3115');
  const [shippingThreshold, setShippingThreshold] = useState(1500);
  const [shippingText, setShippingText] = useState('Free shipping over ₹1,500');
  const [shippingCharge, setShippingCharge] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.logoText !== undefined) setLogoText(data.logoText);
          if (data.logoImage !== undefined) setLogoImage(data.logoImage);
          if (data.showTextWithImage !== undefined) setShowTextWithImage(data.showTextWithImage);
          if (data.siteBgColor !== undefined) setSiteBgColor(data.siteBgColor);
          if (data.heroBgColor !== undefined) setHeroBgColor(data.heroBgColor);
          if (data.accentColor !== undefined) setAccentColor(data.accentColor);
          if (data.textColor !== undefined) setTextColor(data.textColor);
          if (data.headerFont !== undefined) setHeaderFont(data.headerFont);
          if (data.headerTracking !== undefined) setHeaderTracking(data.headerTracking);
          if (data.headerUppercase !== undefined) setHeaderUppercase(data.headerUppercase);
          if (data.buttonRadius !== undefined) setButtonRadius(data.buttonRadius);
          
          if (data.heroTag !== undefined) setHeroTag(data.heroTag);
          if (data.heroTitle !== undefined) setHeroTitle(data.heroTitle);
          if (data.heroDesc !== undefined) setHeroDesc(data.heroDesc);
          if (data.heroImage !== undefined) setHeroImage(data.heroImage);

          if (data.brandStoryTag !== undefined) setBrandStoryTag(data.brandStoryTag);
          if (data.brandStoryTitle !== undefined) setBrandStoryTitle(data.brandStoryTitle);
          if (data.brandStoryDesc !== undefined) setBrandStoryDesc(data.brandStoryDesc);
          if (data.brandStoryImage1 !== undefined) setBrandStoryImage1(data.brandStoryImage1);
          if (data.brandStoryImage2 !== undefined) setBrandStoryImage2(data.brandStoryImage2);
          if (data.brandStoryLabel !== undefined) setBrandStoryLabel(data.brandStoryLabel);
          if (data.brandStoryProvenanceText !== undefined) setBrandStoryProvenanceText(data.brandStoryProvenanceText);

          if (data.promoActive !== undefined) setPromoActive(data.promoActive);
          if (data.promoTitle !== undefined) setPromoTitle(data.promoTitle);
          if (data.promoSubtitle !== undefined) setPromoSubtitle(data.promoSubtitle);
          if (data.promoDiscount !== undefined) setPromoDiscount(data.promoDiscount);
          if (data.promoCoupon !== undefined) setPromoCoupon(data.promoCoupon);
          if (data.promoImage !== undefined) setPromoImage(data.promoImage);
          if (data.promoLink !== undefined) setPromoLink(data.promoLink);
          if (data.promoButtonText !== undefined) setPromoButtonText(data.promoButtonText);

          if (data.smtpHost !== undefined) setSmtpHost(data.smtpHost);
          if (data.smtpPort !== undefined) setSmtpPort(data.smtpPort);
          if (data.smtpUser !== undefined) setSmtpUser(data.smtpUser);
          if (data.smtpPass !== undefined) setSmtpPass(data.smtpPass);
          if (data.smtpFrom !== undefined) setSmtpFrom(data.smtpFrom);
          if (data.twilioSid !== undefined) setTwilioSid(data.twilioSid);
          if (data.twilioToken !== undefined) setTwilioToken(data.twilioToken);
          if (data.twilioFrom !== undefined) setTwilioFrom(data.twilioFrom);
          if (data.adminPasscode !== undefined) setAdminPasscode(data.adminPasscode);
          if (data.shippingThreshold !== undefined) setShippingThreshold(data.shippingThreshold);
          if (data.shippingText !== undefined) setShippingText(data.shippingText);
          if (data.shippingCharge !== undefined) setShippingCharge(data.shippingCharge);
        }
      } catch (err) {
        console.error('Error reading settings doc:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle preset selection
  const handleApplyPreset = (p: typeof COLOR_PRESETS[0]) => {
    setLogoText(p.logoText);
    setSiteBgColor(p.siteBgColor);
    setHeroBgColor(p.heroBgColor);
    setAccentColor(p.accentColor);
    setTextColor(p.textColor);
    setHeaderFont(p.headerFont);
    setButtonRadius(p.buttonRadius);
    setHeaderTracking(p.headerTracking);
    setHeaderUppercase(p.headerUppercase);
    toast.success(`Theme preset "${p.name}" loaded locally! Click Save to apply.`);
  };

  // Save changes to db
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const loadId = toast.loading('Synchronizing Global Aesthetic settings...');
    try {
      const payload = {
        logoText: logoText.trim(),
        logoImage: logoImage,
        showTextWithImage,
        siteBgColor,
        heroBgColor,
        accentColor,
        textColor,
        headerFont,
        headerTracking,
        headerUppercase,
        buttonRadius,
        heroTag: heroTag.trim(),
        heroTitle: heroTitle.trim(),
        heroDesc: heroDesc.trim(),
        heroImage: heroImage,
        brandStoryTag: brandStoryTag.trim(),
        brandStoryTitle: brandStoryTitle.trim(),
        brandStoryDesc: brandStoryDesc.trim(),
        brandStoryImage1: brandStoryImage1.trim(),
        brandStoryImage2: brandStoryImage2.trim(),
        brandStoryLabel: brandStoryLabel.trim(),
        brandStoryProvenanceText: brandStoryProvenanceText.trim(),
        promoActive,
        promoTitle: promoTitle.trim(),
        promoSubtitle: promoSubtitle.trim(),
        promoDiscount: Number(promoDiscount) || 35,
        promoCoupon: promoCoupon.trim(),
        promoImage: promoImage.trim(),
        promoLink: promoLink.trim(),
        promoButtonText: promoButtonText.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        smtpFrom: smtpFrom.trim(),
        twilioSid: twilioSid.trim(),
        twilioToken: twilioToken.trim(),
        twilioFrom: twilioFrom.trim(),
        adminPasscode: adminPasscode.trim(),
        shippingThreshold: Number(shippingThreshold) || 1500,
        shippingText: shippingText.trim(),
        shippingCharge: Number(shippingCharge) || 0,
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'settings', 'global'), payload);
      toast.success('Global settings synchronized! Changes live instantly.', { id: loadId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update brand setting variables.', { id: loadId });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to static Evia 2026 Default setting
  const handleResetToDefaults = async () => {
    const defaults = COLOR_PRESETS[0];
    setLogoText(defaults.logoText);
    setLogoImage('');
    setShowTextWithImage(true);
    setSiteBgColor(defaults.siteBgColor);
    setHeroBgColor(defaults.heroBgColor);
    setAccentColor(defaults.accentColor);
    setTextColor(defaults.textColor);
    setHeaderFont(defaults.headerFont);
    setHeaderTracking(defaults.headerTracking);
    setHeaderUppercase(defaults.headerUppercase);
    setButtonRadius(defaults.buttonRadius);
    setHeroTag('Sourced & Authenticated · 2026');
    setHeroTitle('Original vintage military surplus.');
    setHeroDesc('We salvage, catalog, and grade rare menswear utility pieces, tactical gear, and cold-weather clothing built to industrial standards. Sourced globally, curated for life.');
    setHeroImage('https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=900');
    setBrandStoryTag('Sourcing Protocol');
    setBrandStoryTitle('Indestructible garments, salvaged for the modern collector.');
    setBrandStoryDesc('Every item in our collection is hand-inspected for physical integrity, original military contract markings, and historical authenticity. We specialize in salvage stock from the 1950s to the 1980s — heavy wools, authentic herringbone denim, and bulletproof military sateen cotton.');
    setBrandStoryImage1('https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=400');
    setBrandStoryImage2('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400');
    setBrandStoryLabel('Verify provenance');
    setBrandStoryProvenanceText('Salvaged Stock Provenance: US Armed Forces (M-65, OG-107), British Commonwealth (Wool Combat), and French Foreign Legion.');
    setPromoActive(false);
    setPromoTitle('Special Archive Deployment Offer');
    setPromoSubtitle('Acquire select pristine utility items at up to 35% off. Sourced globally, validated for authenticity.');
    setPromoDiscount(35);
    setPromoCoupon('ARCHIVE35');
    setPromoImage('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200');
    setPromoLink('');
    setPromoButtonText('Claim 35% Discount');
    setAdminPasscode('3115');
    setShippingThreshold(1500);
    setShippingText('Free shipping over ₹1,500');
    setShippingCharge(0);
 
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        logoText: defaults.logoText,
        logoImage: '',
        showTextWithImage: true,
        siteBgColor: defaults.siteBgColor,
        heroBgColor: defaults.heroBgColor,
        accentColor: defaults.accentColor,
        textColor: defaults.textColor,
        headerFont: defaults.headerFont,
        headerTracking: defaults.headerTracking,
        headerUppercase: defaults.headerUppercase,
        buttonRadius: defaults.buttonRadius,
        heroTag: 'Sourced & Authenticated · 2026',
        heroTitle: 'Original vintage military surplus.',
        heroDesc: 'We salvage, catalog, and grade rare menswear utility pieces, tactical gear, and cold-weather clothing built to industrial standards. Sourced globally, curated for life.',
        heroImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=900',
        brandStoryTag: 'Sourcing Protocol',
        brandStoryTitle: 'Indestructible garments, salvaged for the modern collector.',
        brandStoryDesc: 'Every item in our collection is hand-inspected for physical integrity, original military contract markings, and historical authenticity. We specialize in salvage stock from the 1950s to the 1980s — heavy wools, authentic herringbone denim, and bulletproof military sateen cotton.',
        brandStoryImage1: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=400',
        brandStoryImage2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
        brandStoryLabel: 'Verify provenance',
        brandStoryProvenanceText: 'Salvaged Stock Provenance: US Armed Forces (M-65, OG-107), British Commonwealth (Wool Combat), and French Foreign Legion.',
        promoActive: false,
        promoTitle: 'Special Archive Deployment Offer',
        promoSubtitle: 'Acquire select pristine utility items at up to 35% off. Sourced globally, validated for authenticity.',
        promoDiscount: 35,
        promoCoupon: 'ARCHIVE35',
        promoImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
        promoLink: '',
        promoButtonText: 'Claim 35% Discount',
        adminPasscode: '3115',
        shippingThreshold: 1500,
        shippingText: 'Free shipping over ₹1,500',
        shippingCharge: 0,
        updatedAt: Date.now()
      });
      toast.success('Restored Evia 2026 surplus originals!');
    } catch (e) {
      toast.error('Failed to reset variables to defaults');
    } finally {
      setSubmitting(false);
    }
  };

  // Selected Font Details used for preview rendering
  const activeFontObj = AVAILABLE_FONTS.find(f => f.name === headerFont) || AVAILABLE_FONTS[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading visual settings ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Dynamic font stylesheet loading for local admin preview panel and choices */}
      <link 
        rel="stylesheet" 
        href={`https://fonts.googleapis.com/css2?${AVAILABLE_FONTS.map(f => f.import).join('&')}&display=swap`} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Settings className="text-indigo-600 animate-spin-slow" size={20} />
            <span className="text-[10px] uppercase tracking-[0.25em] text-indigo-600 font-extrabold">Brand Identity System</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Appearance & Theme</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Configure the aesthetic experience of the digital military archive. Customize default backgrounds, font tracking, buttons, and logos with real-time replication.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Form Side (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Quick presets strip */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="text-amber-500" size={16} />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-800">Premium Curated Presets</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => {
                const isActive = siteBgColor === p.siteBgColor && headerFont === p.headerFont;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-stone-300 flex-shrink-0" 
                      style={{ backgroundColor: p.siteBgColor }} 
                    />
                    <span>{p.name.replace('Evia ', '').replace('Garrison ', '')}</span>
                    {isActive && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
            
            {/* Logo Configuration Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Type className="text-indigo-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Custom Brand Logo & Signature</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Logo Text</label>
                  <input 
                    type="text" 
                    value={logoText} 
                    onChange={e => setLogoText(e.target.value)} 
                    placeholder="E.g., evia surplus"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Leave empty to display only image logo.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Logo Display Logic</label>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showTextWithImage} 
                      onChange={e => setShowTextWithImage(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-stone-700">Display text label next to logo image</span>
                  </label>
                </div>
              </div>

              {/* Logo Direct Image asset url input with live preview */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Brand Symbol / Graphic Image URL</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={logoRef}
                    onChange={(e) => handleManualUpload(e, setLogoImage)}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={logoImage} 
                      onChange={e => setLogoImage(e.target.value)} 
                      placeholder="E.g., https://images.unsplash.com/photo-..." 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button 
                      type="button" 
                      onClick={() => logoRef.current?.click()}
                      className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-indigo-600 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
                      title="Upload from gallery"
                    >
                      <UploadCloud size={20} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                    Upload from gallery or use an external secure image URL to optimize brand settings database boundaries.
                  </p>
                  {logoImage && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-1 flex items-center justify-center self-start shadow-sm mt-1">
                      <img src={logoImage} alt="logo symbol" className="max-w-full max-h-full object-contain" onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                      }} />
                      <button 
                        type="button" 
                        onClick={() => setLogoImage('')} 
                        className="absolute -top-1 right-1 p-0.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors shadow-sm outline-none"
                        title="Remove logo URL"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* First (Hero) Section Content Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Sparkles className="text-indigo-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Homepage Hero Section Content</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Greeting Accent Tag Line</label>
                  <input 
                    type="text" 
                    value={heroTag} 
                    onChange={e => setHeroTag(e.target.value)} 
                    placeholder="Sourced & Authenticated · 2026"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hero Main Heading / Title</label>
                  <input 
                    type="text" 
                    value={heroTitle} 
                    onChange={e => setHeroTitle(e.target.value)} 
                    placeholder="Original vintage military surplus."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hero Description text</label>
                  <textarea 
                    value={heroDesc} 
                    onChange={e => setHeroDesc(e.target.value)} 
                    placeholder="Enter editorial text about legacy..."
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors resize-y"
                  />
                </div>

                {/* Hero section right side direct image URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Right-Side Hero Presentation Image URL</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={heroRef}
                      onChange={(e) => handleManualUpload(e, setHeroImage)}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={heroImage} 
                        onChange={e => setHeroImage(e.target.value)} 
                        placeholder="E.g., https://images.unsplash.com/photo-..." 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => heroRef.current?.click()}
                        className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-indigo-600 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
                        title="Upload from gallery"
                      >
                        <UploadCloud size={20} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                      Upload from gallery or use an external secure image URL to scale Hero presentations.
                    </p>
                    {heroImage && (
                      <div className="relative w-36 h-44 rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50 flex items-center justify-center self-start mt-1">
                        <img src={heroImage} alt="hero visual font" className="w-full h-full object-cover" onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                        }} />
                        <button 
                          type="button" 
                          onClick={() => setHeroImage('')} 
                          className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors shadow-md outline-none"
                          title="Remove custom image hero URL"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Editorial Story (Sourcing Protocol / Spread) Section Content Block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Type className="text-amber-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Homepage Editorial Spread (Brand Story)</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category / Protocol Tag</label>
                    <input 
                      type="text" 
                      value={brandStoryTag} 
                      onChange={e => setBrandStoryTag(e.target.value)} 
                      placeholder="Sourcing Protocol"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provenance Button Label</label>
                    <input 
                      type="text" 
                      value={brandStoryLabel} 
                      onChange={e => setBrandStoryLabel(e.target.value)} 
                      placeholder="Verify provenance"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Featured Main Title / Slogan</label>
                  <input 
                    type="text" 
                    value={brandStoryTitle} 
                    onChange={e => setBrandStoryTitle(e.target.value)} 
                    placeholder="Indestructible garments, salvaged for the modern collector."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description Paragraph Text</label>
                  <textarea 
                    value={brandStoryDesc} 
                    onChange={e => setBrandStoryDesc(e.target.value)} 
                    placeholder="Enter editorial text about legacy..."
                    rows={4}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provenance Verification Alert Details</label>
                  <textarea 
                    value={brandStoryProvenanceText} 
                    onChange={e => setBrandStoryProvenanceText(e.target.value)} 
                    placeholder="This popup displays when users verify provenance..."
                    rows={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors resize-y text-stone-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Story Image 1 */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Left-Hand Editorial Image 1 URL</label>
                    <div className="flex flex-col gap-2">
                       <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={story1Ref}
                        onChange={(e) => handleManualUpload(e, setBrandStoryImage1)}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={brandStoryImage1} 
                          onChange={e => setBrandStoryImage1(e.target.value)} 
                          placeholder="Image 1 URL" 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button 
                          type="button" 
                          onClick={() => story1Ref.current?.click()}
                          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-indigo-600 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
                        >
                          <UploadCloud size={20} />
                        </button>
                      </div>
                      {brandStoryImage1 && (
                        <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50 flex items-center justify-center mt-1">
                          <img src={brandStoryImage1} alt="story 1" className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                          }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Story Image 2 */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Right-Hand (Slightly Lower) Image 2 URL</label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={story2Ref}
                        onChange={(e) => handleManualUpload(e, setBrandStoryImage2)}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={brandStoryImage2} 
                          onChange={e => setBrandStoryImage2(e.target.value)} 
                          placeholder="Image 2 URL" 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button 
                          type="button" 
                          onClick={() => story2Ref.current?.click()}
                          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-indigo-600 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
                        >
                          <UploadCloud size={20} />
                        </button>
                      </div>
                      {brandStoryImage2 && (
                        <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50 flex items-center justify-center mt-1">
                          <img src={brandStoryImage2} alt="story 2" className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=300";
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promotional Banner Configurations Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-600 animate-pulse" size={16} />
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#9333ea]">Promotional Offer Banner</h2>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${promoActive ? "bg-purple-100 text-[#9333ea]" : "bg-stone-100 text-stone-500"}`}>
                  {promoActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Add an eye-catching big promotional offer banner (like up to 35% offers) above the main catalog. Complete with configurable big banner images, customized titles, and coupon codes.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-700">Display Promo Banner on storefront?</span>
                  <span className="text-[11px] text-stone-400 mt-0.5 font-medium">Turns on/off the promotional advertising area.</span>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={promoActive} 
                    onChange={e => setPromoActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9333ea]"></div>
                </label>
              </div>

              {/* Edit Banner Button (Launches beautiful custom builder Modal) */}
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(true)}
                className="w-full py-3 bg-stone-900 border border-stone-950 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-stone-850 shadow-sm active:scale-95"
              >
                <ImageIcon size={14} />
                Configure Banner Section (with Upload Space)
              </button>
            </div>

            {/* Shipping & Delivery Logistics Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Truck className="text-emerald-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#1c1c1c]">Shipping & Delivery Logistics</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free Shipping Threshold</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs font-mono">₹</span>
                    <input 
                      type="number" 
                      value={shippingThreshold} 
                      onChange={e => setShippingThreshold(Number(e.target.value))} 
                      placeholder="e.g. 1500"
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-colors text-stone-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Non-Free Delivery Charge</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs font-mono">₹</span>
                    <input 
                      type="number" 
                      value={shippingCharge} 
                      onChange={e => setShippingCharge(Number(e.target.value))} 
                      placeholder="e.g. 99"
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-colors text-stone-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping Display Text (Banner / Details)</label>
                <input 
                  type="text" 
                  value={shippingText} 
                  onChange={e => setShippingText(e.target.value)} 
                  placeholder="e.g., Free shipping over ₹1,500"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <p className="text-[10px] text-stone-400 mt-2 font-medium">This text will be dynamically replicated on home features and product technical detail labels.</p>
              </div>
            </div>

            {/* Admin Security & Lock Passcode settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Key className="text-indigo-600 animate-pulse" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#1c1c1c]">Admin Panel Lock Passcode</h2>
              </div>
              <p className="text-xs text-stone-550 leading-relaxed font-light">
                Define the secret numeric passcode required to lock/unlock and access the custom Admin Management layout page. The default code is <code className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded font-bold font-mono text-[11px]">3115</code>.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secret Lock Passcode</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    value={adminPasscode} 
                    onChange={e => setAdminPasscode(e.target.value.replace(/\D/g, ''))} 
                    placeholder="E.g. 3115"
                    maxLength={20}
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-colors text-indigo-700"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Key size={14} />
                  </div>
                </div>
                <span className="block text-[10px] text-gray-400 mt-1.5 leading-relaxed">Only numeric digits are permitted. For ultimate bulletproof lock and security, you can customize this field at any time.</span>
              </div>
            </div>

            {/* Official SMTP & SMS OTP Gateways Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="text-amber-500" size={16} />
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#9f3a38]">Official OTP Authentication Gateways</h2>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${(smtpUser && smtpPass) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {(smtpUser && smtpPass) ? "SMTP Configured" : "SMTP Client Fallback"}
                </span>
              </div>

              <p className="text-xs text-stone-550 leading-relaxed font-light">
                Configure standard SMTP credentials and Twilio SMS gateways to trigger real, official OTP dispatches to user inboxes and mobile devices. Without credentials, a secure simulated code is displayed.
              </p>

              {/* SMTP Settings Block */}
              <div className="p-4 bg-stone-50/70 border border-stone-150 rounded-xl space-y-4 text-left">
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={13} className="text-stone-500" />
                  SMTP Mail Gateway settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  <div className="col-span-1 sm:col-span-8">
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">SMTP Outgoing Host</label>
                    <input 
                      type="text" 
                      value={smtpHost} 
                      onChange={e => setSmtpHost(e.target.value)} 
                      placeholder="e.g. smtp.gmail.com" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">SMTP Port</label>
                    <input 
                      type="number" 
                      value={smtpPort} 
                      onChange={e => setSmtpPort(Number(e.target.value) || 465)} 
                      placeholder="e.g. 465 or 587" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">SMTP Username / Email</label>
                    <input 
                      type="email" 
                      value={smtpUser} 
                      onChange={e => setSmtpUser(e.target.value)} 
                      placeholder="e.g. secure-evia-ops@gmail.com" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">SMTP Password / App Password</label>
                    <input 
                      type="password" 
                      value={smtpPass} 
                      onChange={e => setSmtpPass(e.target.value)} 
                      placeholder="Enter SMTP App Password" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">SMTP Verified From Email Header</label>
                  <input 
                    type="text" 
                    value={smtpFrom} 
                    onChange={e => setSmtpFrom(e.target.value)} 
                    placeholder='"EVIA Authentic Items" <noreply@gmail.com>' 
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                  />
                  <span className="block text-[9px] text-stone-400 mt-1">If using Gmail SMTP, this must match or encompass your Gmail SMTP Username for official authenticated delivery.</span>
                </div>
              </div>

              {/* Twilio SMS Panel */}
              <div className="p-4 bg-stone-50/70 border border-stone-150 rounded-xl space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone size={13} className="text-stone-500" />
                    Twilio SMS API Gateway settings
                  </h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${(twilioSid && twilioToken) ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                    {(twilioSid && twilioToken) ? "Twilio Configured" : "Simulated Gateway"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">Twilio Account SID</label>
                    <input 
                      type="text" 
                      value={twilioSid} 
                      onChange={e => setTwilioSid(e.target.value)} 
                      placeholder="e.g. ACxxxxxxxxxxxxxxxx" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">Twilio Auth Token</label>
                    <input 
                      type="password" 
                      value={twilioToken} 
                      onChange={e => setTwilioToken(e.target.value)} 
                      placeholder="Twilio secret token" 
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1">Twilio Sender Phone Number Or SID</label>
                  <input 
                    type="text" 
                    value={twilioFrom} 
                    onChange={e => setTwilioFrom(e.target.value)} 
                    placeholder="e.g. +18146592233" 
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:border-[#9f3a38] outline-none" 
                  />
                  <span className="block text-[9px] text-stone-400 mt-1">Include international plus sign prefix for reliable routing.</span>
                </div>
              </div>
            </div>

            {/* Global Background Elements Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Grid className="text-indigo-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Custom Palette & Backgrounds</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Site main default background */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Site Background Color</label>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{siteBgColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={siteBgColor.startsWith('#') ? siteBgColor : '#faf8f5'} 
                      onChange={e => setSiteBgColor(e.target.value)}
                      className="w-12 h-11 border border-stone-200 rounded-xl p-1 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={siteBgColor} 
                      onChange={e => setSiteBgColor(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Replaces the main default background on all screens.</p>
                </div>

                {/* Hero / first section customizable bg */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">First (Hero) Section Bg</label>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{heroBgColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={heroBgColor.startsWith('#') ? heroBgColor : '#f6f3ed'} 
                      onChange={e => setHeroBgColor(e.target.value)}
                      className="w-12 h-11 border border-stone-200 rounded-xl p-1 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={heroBgColor} 
                      onChange={e => setHeroBgColor(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">The greeting section banner background color.</p>
                </div>

                {/* Accent Highlight (Buttons & labels) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Accent Color</label>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{accentColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={accentColor.startsWith('#') ? accentColor : '#9f3a38'} 
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-12 h-11 border border-stone-200 rounded-xl p-1 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={accentColor} 
                      onChange={e => setAccentColor(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Active highlights, badges, buttons, and links color.</p>
                </div>

                {/* Main default text color */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Default Text Color</label>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{textColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={textColor.startsWith('#') ? textColor : '#1c1c1c'} 
                      onChange={e => setTextColor(e.target.value)}
                      className="w-12 h-11 border border-stone-200 rounded-xl p-1 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={textColor} 
                      onChange={e => setTextColor(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Readability font color across the catalog grids.</p>
                </div>
              </div>
            </div>

            {/* Header Typography Elements */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Type className="text-indigo-600" size={16} />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Header Typography & Form</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Font Family</label>
                  <select 
                    value={headerFont} 
                    onChange={e => setHeaderFont(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  >
                    {AVAILABLE_FONTS.map(f => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Configures display fonts across headings on the store feed.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Letter-Spacing (Tracking)</label>
                  <select 
                    value={headerTracking} 
                    onChange={e => setHeaderTracking(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="-0.04em">Tightest (-0.04em)</option>
                    <option value="-0.02em">Default Tight (-0.02em)</option>
                    <option value="0em">Normal (0.00em)</option>
                    <option value="0.05em">Tracking Wide (+0.05em)</option>
                    <option value="0.1em">Tracking Spaced (+0.10em)</option>
                    <option value="0.2em">High-Impact Minimalist (+0.20em)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Primary Button Style / Corner Sharpness</label>
                  <select 
                    value={buttonRadius} 
                    onChange={e => setButtonRadius(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="9999px">Oval / Rounded Rounded (Traditional)</option>
                    <option value="16px">Curved Organic (16px)</option>
                    <option value="10px">Sleek Modern Border (10px)</option>
                    <option value="6px">Small Sharp Arc (6px)</option>
                    <option value="0px">Absolute Razor Straight (0px - Raw Brutalist)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Header Transformation Flags</label>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={headerUppercase} 
                      onChange={e => setHeaderUppercase(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-stone-700">Force uppercase on display headings</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Buttons block */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {submitting ? 'Synchronizing Archive Palette...' : 'Synchronize Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time visual Mock Sandbox (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <div className="flex items-center gap-1.5">
                <Eye className="text-zinc-600 animate-pulse" size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Simulate Storefront Preview</h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Active Sandbox</span>
            </div>

            {/* Sandbox Canvas */}
            <div 
              className="p-5 flex flex-col gap-5 border-b border-stone-100 transition-colors duration-300"
              style={{ backgroundColor: siteBgColor, color: textColor }}
            >
              
              {/* Simulated Global Header */}
              <div 
                className="p-3 border-b border-zinc-200/50 flex justify-between items-center rounded-xl bg-white/70 backdrop-blur-sm"
                style={{ color: textColor }}
              >
                <div className="flex items-center gap-3">
                  {logoImage ? (
                    <img src={logoImage} alt="Brand Logo" className="h-9 w-9 rounded-full object-cover border border-stone-200 shadow-xs shrink-0" />
                  ) : null}
                  {(!logoImage || showTextWithImage) && (
                    <span 
                      className="font-bold text-sm tracking-tight capitalize"
                      style={{ fontFamily: activeFontObj.css }}
                    >
                      {logoText || 'evia surplus'}
                      <span style={{ color: accentColor }}>/</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
                  <span className="hover:text-zinc-800">Shop</span>
                  <span className="hover:text-zinc-800">Cart</span>
                </div>
              </div>

              {/* Simulated First Section (Hero Banner) */}
              <div 
                className="p-4 rounded-2xl border border-stone-200/40 grid grid-cols-1 md:grid-cols-12 gap-3 relative transition-colors duration-300"
                style={{ backgroundColor: heroBgColor }}
              >
                <div className="md:col-span-8 flex flex-col gap-1.5 justify-center">
                  <span 
                    className="text-[7px] uppercase tracking-[0.18em]" 
                    style={{ color: accentColor }}
                  >
                    {heroTag || "Sourced & Authenticated · 2026"}
                  </span>
                  
                  <h1 
                    className="text-lg leading-none transition-all"
                    style={{ 
                      fontFamily: activeFontObj.css, 
                      letterSpacing: headerTracking, 
                      textTransform: headerUppercase ? 'uppercase' : 'none',
                      color: textColor
                    }}
                  >
                    {heroTitle || "Original vintage military surplus."}
                  </h1>
                  
                  <p className="text-[8px] text-zinc-500 leading-tight line-clamp-2">
                    {heroDesc || "Indestructible military salvage workwear with historical gravity. Curated for life."}
                  </p>

                  <div className="flex gap-1.5 mt-1">
                    <button 
                      disabled 
                      className="px-2 py-1 text-[6px] uppercase font-bold tracking-widest text-white shrink-0 cursor-default"
                      style={{ backgroundColor: accentColor, borderRadius: buttonRadius }}
                    >
                      Shop Collection
                    </button>
                    <button 
                      disabled 
                      className="px-2 py-1 text-[6px] uppercase font-bold tracking-widest border border-zinc-200/80 bg-white/50 text-zinc-700 shrink-0 cursor-default"
                      style={{ borderRadius: buttonRadius }}
                    >
                      Our Story
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4 shrink-0 flex items-center justify-center">
                  <img 
                    src={heroImage || "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=900"} 
                    alt="Hero preview"
                    className="w-12 h-16 rounded-xl object-cover border border-stone-200 shadow-xs"
                  />
                </div>
              </div>

              {/* Simulated Grid Header */}
              <div className="border-t border-zinc-200/50 pt-3 flex justify-between items-end">
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">Archive Inventory</span>
                  <h2 
                    className="text-lg uppercase transition-all mt-0.5"
                    style={{ 
                      fontFamily: activeFontObj.css, 
                      letterSpacing: headerTracking, 
                      textTransform: headerUppercase ? 'uppercase' : 'none' 
                    }}
                  >
                    Surplus Catalog
                  </h2>
                </div>
                <span className="text-[9px] text-zinc-400 font-medium">14 premium objects</span>
              </div>

              {/* Simulated Product Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden flex flex-col p-2 gap-2">
                  <div className="aspect-[3/4] bg-stone-100 rounded-lg relative overflow-hidden flex items-center justify-center text-stone-300 font-mono text-[9px]">
                    [Product Image]
                    <span 
                      className="absolute left-1.5 top-1.5 bg-orange-600 text-white rounded text-[7px] px-1 py-0.5 font-bold"
                    >
                      Few Left
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest text-stone-400 uppercase">Outerwear</span>
                    <h3 
                      className="text-[10px] font-bold leading-tight line-clamp-1 mt-0.5 text-stone-850"
                      style={{ color: textColor }}
                    >
                      US Army M-65 Field Jacket
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="bg-emerald-600 text-white text-[8px] px-1 rounded flex items-center gap-0.5 font-bold">4.8 <span className="text-[6px]">★</span></span>
                      <span className="text-[7px] text-stone-400 font-semibold">(24)</span>
                    </div>
                    
                    <div className="mt-2 pt-1 border-t border-stone-100 flex items-baseline gap-1.5">
                      <span className="font-extrabold text-xs text-stone-900">₹14,500</span>
                      <span className="text-[8px] text-stone-400 line-through">₹19,575</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden flex flex-col p-2 gap-2">
                  <div className="aspect-[3/4] bg-stone-100 rounded-lg relative overflow-hidden flex items-center justify-center text-stone-300 font-mono text-[9px]">
                    [Product Image]
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest text-stone-400 uppercase">Combat Pants</span>
                    <h3 
                      className="text-[10px] font-bold leading-tight line-clamp-1 mt-0.5 text-stone-850"
                      style={{ color: textColor }}
                    >
                      HBT Marine Fatigue Trousers
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="bg-emerald-600 text-white text-[8px] px-1 rounded flex items-center gap-0.5 font-bold">4.7 <span className="text-[6px]">★</span></span>
                      <span className="text-[7px] text-stone-400 font-semibold">(18)</span>
                    </div>
                    
                    <div className="mt-2 pt-1 border-t border-stone-100 flex items-baseline gap-1.5">
                      <span className="font-extrabold text-xs text-stone-900">₹11,200</span>
                      <span className="text-[8px] text-stone-400 line-through">₹15,120</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Helper Tips */}
            <div className="p-4.5 bg-stone-50 text-[11px] text-stone-500 leading-relaxed">
              💡 <span className="font-bold text-stone-700">Curator Pro-Tip:</span> Pair high-contrast light backgrounds like <span className="font-mono text-xs">#faf8f5</span> with high letter-tracking like <span className="font-bold">Tracking Spaced</span> to craft a premium minimalist Swiss design, or choose dark palettes for a high-intensity stealth tactical feel.
            </div>
          </div>
        </div>

      </div>

      {/* Promotional Banner Builder Custom Modal (Ok That Type) */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsPromoModalOpen(false)}></div>

          {/* Modal layout container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl border border-stone-200">
              
              {/* Header */}
              <div className="bg-stone-50 border-b border-stone-100 p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-purple-50 p-2 text-[#9333ea]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#9333ea]">Storefront Promo Banner Builder</h3>
                    <p className="text-[11px] text-stone-500 font-medium">Build a beautiful dynamic 35% offer banner for top of products catalog</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsPromoModalOpen(false)}
                  className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body block (Dual pane: Left form + Right Live Preview) */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Form parameters partition */}
                <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-stone-100 max-h-[70vh] overflow-y-auto">
                  <div className="flex flex-col gap-5">
                    
                    {/* Action toggler state */}
                    <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#9333ea]">Activate Section On Storefront</span>
                        <span className="text-[10px] text-purple-600 mt-0.5">Toggle live status instantly</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={promoActive} 
                          onChange={e => setPromoActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9333ea]"></div>
                      </label>
                    </div>

                    {/* Promo Section Title */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Promotion Section Header</label>
                      <input 
                        type="text" 
                        value={promoTitle} 
                        onChange={e => setPromoTitle(e.target.value)} 
                        placeholder="E.g., Special Archive Deployment Offer"
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:border-purple-500 outline-none transition-colors"
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Description & details</label>
                      <textarea 
                        value={promoSubtitle} 
                        onChange={e => setPromoSubtitle(e.target.value)} 
                        rows={2}
                        placeholder="Explain the offer, highlight vintage gear, or give terms..."
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:border-purple-500 outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Percent Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">Discount Percent</label>
                          <span className="text-xs font-black text-[#9333ea]">{promoDiscount}% OFF</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="95" 
                          step="5"
                          value={promoDiscount} 
                          onChange={e => setPromoDiscount(Number(e.target.value))} 
                          className="w-full h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-[#9333ea]"
                        />
                      </div>

                      {/* Coupon Code input */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Coupon Promo Code</label>
                        <input 
                          type="text" 
                          value={promoCoupon} 
                          onChange={e => setPromoCoupon(e.target.value.toUpperCase().replace(/\s/g, ''))} 
                          placeholder="E.g., ARCHIVE35"
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800 tracking-wider focus:border-purple-500 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Trigger button label */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Action Button text</label>
                        <input 
                          type="text" 
                          value={promoButtonText} 
                          onChange={e => setPromoButtonText(e.target.value)} 
                          placeholder="Claim Discount"
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:border-purple-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Target hyper-link */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Button Link Destination</label>
                        <input 
                          type="text" 
                          value={promoLink} 
                          onChange={e => setPromoLink(e.target.value)} 
                          placeholder="Default is #catalog to scroll down"
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:border-purple-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Big Promotional Banner Image input place */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Banner image asset URL / Upload path</label>
                      <div className="flex flex-col gap-3">
                         <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={promoRef}
                          onChange={(e) => handleManualUpload(e, setPromoImage)}
                        />
                        <div className="flex gap-2">
                          <input 
                            type="url" 
                            value={promoImage} 
                            onChange={e => setPromoImage(e.target.value)} 
                            placeholder="E.g., https://images.unsplash.com/photo-..." 
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:border-purple-500 transition-colors"
                          />
                          <button 
                            type="button" 
                            onClick={() => promoRef.current?.click()}
                            className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-purple-600 rounded-xl transition-all shadow-sm flex-shrink-0 active:scale-95"
                            title="Upload banner"
                          >
                            <UploadCloud size={18} />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 leading-normal">
                          Input custom image URL above, upload from device, or select a preset:
                        </p>
                      </div>

                      {/* Professional Unsplash presets to offer instant high-fidelity banners */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { name: 'Oatmeal Shop', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200' },
                          { name: 'Depot Warehouse', url: 'https://images.unsplash.com/photo-1558441719-ff34b0524a24?auto=format&fit=crop&q=80&w=1200' },
                          { name: 'Vintage Suits', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200' }
                        ].map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setPromoImage(item.url);
                              toast.success(`Preset image "${item.name}" set!`);
                            }}
                            className={`p-1 rounded-xl border relative text-left overflow-hidden transition-all group hover:scale-98 cursor-pointer ${promoImage === item.url ? 'border-[#9333ea] ring-2 ring-purple-100' : 'border-stone-200'}`}
                          >
                            <div className="aspect-[16/9] w-full rounded-md overflow-hidden bg-stone-100">
                              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="block text-[9px] mt-1 font-bold text-stone-600 px-0.5 truncate">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Live Preview Column */}
                <div className="lg:col-span-5 p-6 bg-stone-50/50 flex flex-col justify-between max-h-[70vh] overflow-y-auto">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Real-time Banner Preview
                    </h4>

                    {/* Standard banner rendering */}
                    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-md flex flex-col">
                      <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={promoImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200"} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200";
                          }}
                        />
                        {/* Elegant overlay badge */}
                        <div className="absolute top-3 left-3 bg-[#9333ea] text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md">
                          {promoDiscount}% OFF
                        </div>
                      </div>

                      {/* Text Section */}
                      <div className="p-4 text-left">
                        <span className="text-[8px] font-bold text-purple-600 uppercase tracking-widest block mb-1">Coupon code: {promoCoupon || 'NONE'}</span>
                        <h4 className="text-sm font-bold text-stone-900 leading-tight line-clamp-1">{promoTitle || "No Title Specified"}</h4>
                        <p className="text-[10px] text-stone-500 font-medium leading-relaxed mt-1 line-clamp-2">{promoSubtitle || "Include customized details about your active sales campaign."}</p>
                        
                        <button 
                          disabled
                          className="mt-3.5 w-full py-2 bg-stone-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-not-allowed"
                        >
                          {promoButtonText || "Shop Promo"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-150 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPromoModalOpen(false);
                        toast.success('Configuration captured locally! Click "Synchronize Settings" below to publish live.');
                      }}
                      className="w-full py-3 bg-[#9333ea] hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Check size={14} />
                      Save Parameters
                    </button>
                    <p className="text-[10px] text-stone-400 font-medium text-center leading-normal px-2">
                       Make sure to click the green <span className="font-bold text-stone-600">"Synchronize Settings"</span> button afterwards to commit your finalized configuration to the persistent ledger.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
