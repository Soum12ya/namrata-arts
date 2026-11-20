import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lock, Unlock, Plus, Trash2, Edit3, X, ArrowUpRight, ArrowRight,
  Upload, Check, RotateCw, Minus, Menu, MessageCircle, Database,
} from 'lucide-react';
import HeroMotionCanvas from './components/HeroMotionCanvas';
import ArtPieceRenderer from './components/ArtPieceRenderer';
import PhysicalCanvas3D from './components/PhysicalCanvas3D';
import StudioTurntableModal, { EditorialReveal } from './components/StudioTurntableModal';
import { INITIAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data/seedData';
import {
  isFirebaseConfigured,
  subscribeProducts,
  subscribeCategories,
  subscribeOrders,
  createProduct,
  updateProduct,
  removeProduct,
  createCategory,
  removeCategory,
  submitOrderOrCommission,
  updateOrderStatus,
  removeOrder,
  getStudioSettings,
  saveStudioSettings,
  seedFirestoreCatalog,
} from './services/db';
import { uploadImageToCloudinary } from './services/cloudinary';
import { sendAdminEmailAlert, buildWhatsAppLink } from './services/notifications';

export default function App() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [dbLive, setDbLive] = useState(false);

  // Live Firestore subscriptions
  useEffect(() => {
    const unsubP = subscribeProducts((list) => {
      if (list.length > 0) {
        setProducts(list);
        setDbLive(true);
      }
    });
    const unsubC = subscribeCategories((list) => {
      if (list.length > 0) setCategories(list);
    });
    const unsubO = subscribeOrders(setOrders);
    getStudioSettings().then(setSettings).catch(() => {});
    return () => {
      unsubP();
      unsubC();
      unsubO();
    };
  }, []);

  // Hero 3D Stage State
  const heroFeatured = useMemo(() => {
    const f = products.filter((p) => p.featured);
    return f.length > 0 ? f.slice(0, 4) : products.slice(0, 4);
  }, [products]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroTilt, setHeroTilt] = useState({ x: -4, y: -14 });
  const [isSwitchingHero, setIsSwitchingHero] = useState(false);

  const activeHeroPiece = heroFeatured[heroIndex % Math.max(1, heroFeatured.length)] || products[0];

  const handleSelectHeroPiece = (idx) => {
    if (idx === heroIndex) return;
    setIsSwitchingHero(true);
    setHeroTilt({ x: 0, y: 78 });
    setTimeout(() => {
      setHeroIndex(idx);
      setHeroTilt({ x: -4, y: -14 });
      setIsSwitchingHero(false);
    }, 240);
  };

  // Catalog Filters & Navigation
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Inspection Modal & Bag Drawer
  const [inspectProduct, setInspectProduct] = useState(null);
  const [bag, setBag] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [bagCustomerName, setBagCustomerName] = useState('');
  const [bagCustomerContact, setBagCustomerContact] = useState('');
  const [bagSubmitting, setBagSubmitting] = useState(false);
  const [bagReceipt, setBagReceipt] = useState(null);

  // Custom Commission Studio State
  const [commDepartment, setCommDepartment] = useState('Fine Art');
  const [commCategory, setCommCategory] = useState('Portrait Sketching');
  const [commPalette, setCommPalette] = useState('Charcoal & Warm Ivory');
  const [commSize, setCommSize] = useState('Medium (12 × 16 IN / Standard)');
  const [commName, setCommName] = useState('');
  const [commContact, setCommContact] = useState('');
  const [commNotes, setCommNotes] = useState('');
  const [commRefFile, setCommRefFile] = useState(null);
  const [commRefPreview, setCommRefPreview] = useState('');
  const [commSubmitting, setCommSubmitting] = useState(false);
  const [commReceipt, setCommReceipt] = useState(null);

  // Admin Studio State
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [adminTab, setAdminTab] = useState('inventory'); // inventory | orders | categories | settings
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({
    title: '',
    department: 'Fine Art',
    category: 'Portrait Sketching',
    price: '',
    dimensions: '',
    material: '',
    styleKey: 'portrait-sketching',
    imageUrl: '',
    status: 'Available',
    description: '',
  });
  const [newCatName, setNewCatName] = useState('');
  const [newCatDept, setNewCatDept] = useState('Fine Art');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Status Toast
  const [statusNotice, setStatusNotice] = useState('');
  const triggerNotice = useCallback((msg) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(''), 3200);
  }, []);

  // Derived Counts & Filters
  const fineArtCount = useMemo(() => products.filter((p) => p.department === 'Fine Art').length, [products]);
  const woolenCount = useMemo(() => products.filter((p) => p.department === 'Woolen Craft').length, [products]);
  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.status === 'Pending').length, [orders]);

  const visibleCategories = useMemo(
    () => (activeDepartment === 'All' ? categories : categories.filter((c) => c.department === activeDepartment)),
    [categories, activeDepartment]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const deptOk = activeDepartment === 'All' || p.department === activeDepartment;
        const catOk = activeCategory === 'All' || p.category === activeCategory;
        return deptOk && catOk;
      }),
    [products, activeDepartment, activeCategory]
  );

  // Bag Calculations & Checkout
  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);
  const bagSubtotal = bag.reduce((sum, item) => sum + Number(item.product.price) * item.qty, 0);

  const addToBag = (product) => {
    if (product.status !== 'Available') return;
    setBag((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { product, qty: 1 }];
    });
    setBagReceipt(null);
    triggerNotice(`Added "${product.title}" to bag`);
  };

  const updateBagQty = (id, delta) => {
    setBag((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  };

  const handleBagCheckout = async (e) => {
    e.preventDefault();
    if (!bag.length || !bagCustomerName.trim() || !bagCustomerContact.trim()) return;
    setBagSubmitting(true);
    try {
      const summary = bag.map((i) => `${i.product.title} ×${i.qty} (₹${i.product.price * i.qty})`).join(', ');
      const fullSummary = giftNote.trim() ? `${summary} | Gift Note: ${giftNote.trim()}` : summary;
      const { orderCode } = await submitOrderOrCommission({
        kind: 'order',
        customerName: bagCustomerName.trim(),
        phone: bagCustomerContact.trim(),
        summary: fullSummary,
        totalAmount: bagSubtotal,
      });
      await sendAdminEmailAlert({
        orderCode,
        kind: 'order',
        customerName: bagCustomerName.trim(),
        phone: bagCustomerContact.trim(),
        summary: fullSummary,
        totalAmount: bagSubtotal,
      }).catch(() => {});

      setBagReceipt({ orderCode, customerName: bagCustomerName.trim(), summary: fullSummary, totalAmount: bagSubtotal });
      setBag([]);
      setGiftNote('');
      triggerNotice(`Order ${orderCode} reserved`);
    } catch {
      triggerNotice('Order failed — check Firebase setup');
    } finally {
      setBagSubmitting(false);
    }
  };

  // Commission Live Estimate & Submit
  const commissionEstimate = useMemo(() => {
    const baseMap = {
      'Portrait Sketching': 3400,
      'Abstract Drawing': 3000,
      'Indian Art': 4400,
      'Jamini Roy Art': 5200,
      Muffler: 1850,
      'Key Rings': 480,
      'Flower Bouquet': 1600,
    };
    const multMap = {
      'Small (8 × 10 IN / Petite)': 0.85,
      'Medium (12 × 16 IN / Standard)': 1,
      'Large (18 × 24 IN / Collector)': 1.45,
    };
    return Math.round(((baseMap[commCategory] || 2400) * (multMap[commSize] || 1)) / 50) * 50;
  }, [commCategory, commSize]);

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setCommSubmitting(true);
    try {
      let referenceImageUrl = '';
      if (commRefFile && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
        referenceImageUrl = await uploadImageToCloudinary(commRefFile);
      }
      const summary = `${commCategory} · ${commPalette} · ${commSize}${commNotes ? ` · Notes: ${commNotes}` : ''}`;
      const { orderCode } = await submitOrderOrCommission({
        kind: 'commission',
        customerName: commName.trim(),
        phone: commContact.trim(),
        summary,
        totalAmount: commissionEstimate,
        referenceImageUrl,
      });
      await sendAdminEmailAlert({
        orderCode,
        kind: 'commission',
        customerName: commName.trim(),
        phone: commContact.trim(),
        summary,
        totalAmount: commissionEstimate,
        referenceImageUrl,
      }).catch(() => {});

      setCommReceipt({ orderCode, customerName: commName.trim(), summary, totalAmount: commissionEstimate });
      triggerNotice(`Commission ${orderCode} sent to studio`);
    } catch {
      triggerNotice('Submission failed — check Firebase/Cloudinary keys');
    } finally {
      setCommSubmitting(false);
    }
  };

  // Admin Operations
  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pwInput === settings.adminPassword) {
      setAdminUnlocked(true);
      setPwError('');
      setPwInput('');
    } else {
      setPwError('Incorrect password. Please try again.');
    }
  };

  const handleAdminPhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
        const url = await uploadImageToCloudinary(file);
        setFormState((prev) => ({ ...prev, imageUrl: url }));
        triggerNotice('Photo uploaded to Cloudinary');
      } else {
        const reader = new FileReader();
        reader.onload = () => setFormState((prev) => ({ ...prev, imageUrl: String(reader.result || '') }));
        reader.readAsDataURL(file);
      }
    } catch {
      triggerNotice('Cloudinary upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveCreation = async (e) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.price) return;

    const matchedCat = categories.find((c) => c.name === formState.category);
    const dept = matchedCat ? matchedCat.department : formState.department;
    const payload = { ...formState, department: dept, price: Number(formState.price) };

    if (editingId) {
      if (dbLive) await updateProduct(editingId, payload);
      else setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
      setEditingId(null);
      triggerNotice('Creation updated in archive');
    } else {
      const nextNum = String(products.length + 1).padStart(2, '0');
      const created = {
        catalogNo: `NO. ${nextNum}`,
        ...payload,
        featured: false,
        edition: dept === 'Fine Art' ? 'ORIGINAL 1 OF 1' : 'HANDCRAFTED EDITION',
      };
      if (isFirebaseConfigured) await createProduct(created);
      else setProducts((prev) => [{ id: `ks-${Date.now()}`, ...created }, ...prev]);
      triggerNotice(`Published "${created.title}"`);
    }

    setFormState({
      title: '',
      department: 'Fine Art',
      category: categories[0]?.name || 'Portrait Sketching',
      price: '',
      dimensions: '',
      material: '',
      styleKey: 'portrait-sketching',
      imageUrl: '',
      status: 'Available',
      description: '',
    });
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setFormState({
      title: item.title,
      department: item.department,
      category: item.category,
      price: String(item.price),
      dimensions: item.dimensions || '',
      material: item.material || '',
      styleKey: item.styleKey || 'portrait-sketching',
      imageUrl: item.imageUrl || '',
      status: item.status || 'Available',
      description: item.description || '',
    });
    setAdminTab('inventory');
  };

  const handleInlinePrice = async (id, val) => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return;
    if (dbLive) await updateProduct(id, { price: num });
    else setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price: num } : p)));
  };

  const handleCycleStatus = async (item) => {
    const order = ['Available', 'Made to Order', 'Sold'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    if (dbLive) await updateProduct(item.id, { status: next });
    else setProducts((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: next } : p)));
  };

  const handleDeleteProduct = async (id) => {
    if (dbLive) await removeProduct(id);
    else setProducts((prev) => prev.filter((p) => p.id !== id));
    triggerNotice('Work removed from catalog');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      triggerNotice('Category already exists');
      return;
    }
    if (isFirebaseConfigured) await createCategory(trimmed, newCatDept);
    else setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: trimmed, department: newCatDept }]);
    setNewCatName('');
    triggerNotice(`Added category "${trimmed}"`);
  };

  const handleDeleteCategory = async (cat) => {
    if (dbLive) await removeCategory(cat.id);
    else setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (activeCategory === cat.name) setActiveCategory('All');
    triggerNotice(`Removed category "${cat.name}"`);
  };

  return (
    <div className="min-h-screen bg-[#F6F2EB] text-[#1C1917] selection:bg-[#B54534]/20 selection:text-[#1C1917] relative overflow-x-hidden">
      <style>{`
        .font-serif-editorial { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans-clean { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-mono-meta { font-family: 'IBM Plex Mono', monospace; }
        @keyframes maskSlideUp {
          0% { transform: translateY(105%); opacity: 0; }
          100% { transform: translateY(0%); opacity: 1; }
        }
        .animate-mask-up { animation: maskSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-mask-up-delay { opacity: 0; animation: maskSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 140ms forwards; }
        @keyframes studioMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-studio-marquee { display: flex; width: max-content; animation: studioMarquee 34s linear infinite; }
        .marquee-wrap:hover .animate-studio-marquee { animation-play-state: paused; }
      `}</style>

      {/* Subtle 3% Archival Paper Grain Overlay */}
      <svg className="pointer-events-none fixed inset-0 z-40 w-full h-full opacity-[0.035]" aria-hidden="true">
        <filter id="archival-paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#archival-paper-grain)" />
      </svg>

      {statusNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-[#F6F2EB] px-5 py-3 border border-[#F6F2EB]/20 font-mono-meta text-xs tracking-wider">
          {statusNotice}
        </div>
      )}

      {/* 1. MINIMAL TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-[#F6F2EB]/92 backdrop-blur-md border-b border-[#1C1917]/12">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
          <a href="#top" className="flex flex-col">
            <span className="font-serif-editorial text-2xl sm:text-[26px] font-semibold tracking-[0.14em] text-[#1C1917] leading-none">
              {settings.studioName}
            </span>
            <span className="font-mono-meta text-[9px] uppercase tracking-[0.22em] text-[#6D645B] mt-1">
              {settings.tagline}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 font-sans-clean text-xs uppercase tracking-[0.16em] text-[#6D645B]">
            <a href="#exhibition" onClick={() => { setActiveDepartment('All'); setActiveCategory('All'); }} className="hover:text-[#1C1917] transition-colors">Exhibition</a>
            <a href="#exhibition" onClick={() => { setActiveDepartment('Fine Art'); setActiveCategory('All'); }} className="hover:text-[#1C1917] transition-colors">Fine Art</a>
            <a href="#exhibition" onClick={() => { setActiveDepartment('Woolen Craft'); setActiveCategory('All'); }} className="hover:text-[#1C1917] transition-colors">Woolen Craft</a>
            <a href="#commissions" className="hover:text-[#1C1917] transition-colors">Commissions</a>
          </nav>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="inline-flex items-center gap-1.5 font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#6D645B] hover:text-[#1C1917] transition-colors"
            >
              {adminUnlocked ? <Unlock className="w-3.5 h-3.5 text-[#B54534]" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Admin Studio</span>
              {pendingOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#B54534] text-[#F6F2EB] text-[9px]">{pendingOrdersCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setBagOpen(true); setBagReceipt(null); }}
              className="font-mono-meta text-xs uppercase tracking-[0.14em] text-[#1C1917] border-b border-[#1C1917] pb-0.5 hover:text-[#B54534] hover:border-[#B54534] transition-colors"
            >
              Bag [{bagCount}]
            </button>

            <button type="button" onClick={() => setMobileMenuOpen((v) => !v)} className="md:hidden p-1.5 border border-[#1C1917]/15" aria-label="Toggle Menu">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1C1917]/12 bg-[#F6F2EB] px-5 py-4 flex flex-col gap-3 font-sans-clean text-xs uppercase tracking-[0.16em]">
            <a href="#exhibition" onClick={() => { setActiveDepartment('All'); setActiveCategory('All'); setMobileMenuOpen(false); }}>Exhibition</a>
            <a href="#exhibition" onClick={() => { setActiveDepartment('Fine Art'); setActiveCategory('All'); setMobileMenuOpen(false); }}>Fine Art</a>
            <a href="#exhibition" onClick={() => { setActiveDepartment('Woolen Craft'); setActiveCategory('All'); setMobileMenuOpen(false); }}>Woolen Craft</a>
            <a href="#commissions" onClick={() => setMobileMenuOpen(false)}>Commissions</a>
          </div>
        )}
      </header>

      {/* 2. ASYMMETRIC EDITORIAL HERO WITH 60FPS CANVAS & 3D PHYSICAL FRAME */}
      <section
        id="top"
        className="relative border-b border-[#1C1917]/12 overflow-hidden"
        onMouseMove={(e) => {
          if (isSwitchingHero) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          setHeroTilt({ x: -ny * 12, y: nx * 18 - 10 });
        }}
        onMouseLeave={() => { if (!isSwitchingHero) setHeroTilt({ x: -4, y: -14 }); }}
      >
        <HeroMotionCanvas />

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-14 lg:gap-8 items-center">
            <div className="lg:col-span-6 space-y-7">
              <div className="flex items-center gap-3 font-mono-meta text-[11px] uppercase tracking-[0.22em] text-[#6D645B]">
                <span>STUDIO ARCHIVE — EST. 2026</span>
                <span className="h-px w-10 bg-[#1C1917]/25" />
                <span className="text-[#B54534]">KOLKATA / INDIA</span>
              </div>

              <h1 className="font-serif-editorial text-6xl sm:text-7xl lg:text-[84px] font-medium text-[#1C1917] leading-[0.96] tracking-tight">
                <span className="block overflow-hidden"><span className="block animate-mask-up">Hand-Drawn.</span></span>
                <span className="block overflow-hidden"><span className="block italic text-[#B54534] animate-mask-up-delay">Hand-Spun.</span></span>
              </h1>

              <p className="font-sans-clean text-sm sm:text-base text-[#6D645B] max-w-md leading-relaxed">
                An independent studio by {settings.artistName} dedicated to archival charcoal portraits, Jamini Roy folk tempera, and slow-crafted merino wool keepsakes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a href="#exhibition" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-sans-clean text-xs uppercase tracking-[0.18em] transition-colors">
                  <span>Explore Exhibition</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a href="#commissions" className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#1C1917]/25 hover:border-[#1C1917] text-[#1C1917] font-sans-clean text-xs uppercase tracking-[0.18em] transition-colors bg-[#F6F2EB]/60">
                  <span>Commission a Piece</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col items-center">
              {activeHeroPiece && (
                <>
                  <div onClick={() => setInspectProduct(activeHeroPiece)} className="cursor-pointer py-4" title="Click to open 360° 3D Studio Inspection">
                    <PhysicalCanvas3D
                      product={activeHeroPiece}
                      artistName={settings.artistName}
                      studioName={settings.studioName}
                      rotX={heroTilt.x}
                      rotY={heroTilt.y}
                      depth={22}
                    />
                  </div>

                  <div className="mt-10 w-full max-w-md border-t border-[#1C1917]/15 pt-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <span className="font-mono-meta text-[10px] uppercase tracking-[0.2em] text-[#B54534]">
                          {activeHeroPiece.catalogNo} · {activeHeroPiece.category}
                        </span>
                        <h2 className="font-serif-editorial text-2xl font-semibold text-[#1C1917]">
                          {activeHeroPiece.title}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectProduct(activeHeroPiece)}
                        className="font-mono-meta text-[11px] uppercase tracking-wider text-[#1C1917] border-b border-[#1C1917]/40 hover:border-[#B54534] hover:text-[#B54534] inline-flex items-center gap-1 shrink-0"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Inspect 3D</span>
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {heroFeatured.map((piece, idx) => (
                        <button
                          key={piece.id}
                          type="button"
                          onClick={() => handleSelectHeroPiece(idx)}
                          className={`flex-1 text-left py-2 border-t-2 transition-colors font-mono-meta text-[10px] uppercase tracking-wider truncate ${
                            idx === heroIndex % heroFeatured.length
                              ? 'border-[#B54534] text-[#1C1917]'
                              : 'border-[#1C1917]/15 text-[#6D645B] hover:text-[#1C1917]'
                          }`}
                        >
                          0{idx + 1} · {piece.category.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HORIZONTAL TYPOGRAPHIC STUDIO MARQUEE */}
      <div className="marquee-wrap border-b border-[#1C1917]/12 bg-[#ECE6DB] py-3.5 overflow-hidden">
        <div className="animate-studio-marquee font-mono-meta text-[11px] uppercase tracking-[0.24em] text-[#1C1917]/80">
          {[0, 1].map((dup) => (
            <span key={dup} className="inline-flex items-center gap-8 pr-8">
              <span>PORTRAIT SKETCHING</span><span className="text-[#B54534]">·</span>
              <span>JAMINI ROY TEMPERA</span><span className="text-[#B54534]">·</span>
              <span>HAND-KNIT MUFFLERS</span><span className="text-[#B54534]">·</span>
              <span>WOOLEN BOUQUETS</span><span className="text-[#B54534]">·</span>
              <span>INDIAN FOLK ART</span><span className="text-[#B54534]">·</span>
              <span>CUSTOM COMMISSIONS</span><span className="text-[#B54534]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4. DUAL-CRAFT EDITORIAL SPLIT BAND ("THE EASEL" VS "THE LOOM") */}
      <section className="border-b border-[#1C1917]/12">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1C1917]/12">
          <a href="#exhibition" onClick={() => { setActiveDepartment('Fine Art'); setActiveCategory('All'); }} className="group p-8 sm:p-12 lg:p-16 bg-[#F6F2EB] hover:bg-[#ECE6DB]/70 transition-colors flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between font-mono-meta text-[11px] uppercase tracking-[0.2em] text-[#6D645B]">
              <span>DEPARTMENT 01</span><span>{String(fineArtCount).padStart(2, '0')} WORKS</span>
            </div>
            <div className="my-8">
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-medium text-[#1C1917] group-hover:text-[#B54534] transition-colors">The Easel</h2>
              <p className="font-sans-clean text-sm text-[#6D645B] mt-2 max-w-md">
                Portrait Sketching, Abstract Drawing, Indian Heritage Miniatures, and Jamini Roy Folk Tempera on cotton rag and linen.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 font-mono-meta text-xs uppercase tracking-[0.16em] text-[#1C1917]">
              <span>View Fine Art</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </a>

          <a href="#exhibition" onClick={() => { setActiveDepartment('Woolen Craft'); setActiveCategory('All'); }} className="group p-8 sm:p-12 lg:p-16 bg-[#F6F2EB] hover:bg-[#ECE6DB]/70 transition-colors flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between font-mono-meta text-[11px] uppercase tracking-[0.2em] text-[#6D645B]">
              <span>DEPARTMENT 02</span><span>{String(woolenCount).padStart(2, '0')} WORKS</span>
            </div>
            <div className="my-8">
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-medium text-[#1C1917] group-hover:text-[#293B4D] transition-colors">The Loom</h2>
              <p className="font-sans-clean text-sm text-[#6D645B] mt-2 max-w-md">
                Hand-Knitted Merino Mufflers, Micro-Crocheted Botanical Key Rings, and Everlasting Woolen Flower Bouquets.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 font-mono-meta text-xs uppercase tracking-[0.16em] text-[#1C1917]">
              <span>View Woolen Craft</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </a>
        </div>
      </section>

      {/* 5. CURATED EXHIBITION CATALOG */}
      <section id="exhibition" className="py-20 sm:py-28 border-b border-[#1C1917]/12">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-[#1C1917]/12">
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-[0.22em] text-[#B54534]">CURATED EXHIBITION CATALOG</p>
              <h2 className="font-serif-editorial text-4xl sm:text-6xl font-medium text-[#1C1917] mt-2">Selected Works</h2>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono-meta text-xs uppercase tracking-[0.16em]">
              {['All', 'Fine Art', 'Woolen Craft'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => { setActiveDepartment(dept); setActiveCategory('All'); }}
                  className={`pb-1.5 border-b-2 transition-colors ${activeDepartment === dept ? 'border-[#1C1917] text-[#1C1917]' : 'border-transparent text-[#6D645B] hover:text-[#1C1917]'}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5 border-b border-[#1C1917]/12 font-sans-clean text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`py-1 transition-colors ${activeCategory === 'All' ? 'text-[#B54534] font-semibold underline underline-offset-8' : 'text-[#6D645B] hover:text-[#1C1917]'}`}
            >
              All Categories
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`py-1 transition-colors ${activeCategory === cat.name ? 'text-[#B54534] font-semibold underline underline-offset-8' : 'text-[#6D645B] hover:text-[#1C1917]'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#1C1917]/20 mt-10">
              <p className="font-serif-editorial text-2xl text-[#1C1917]">No works currently listed under this selection.</p>
              <button type="button" onClick={() => { setActiveDepartment('All'); setActiveCategory('All'); }} className="mt-4 font-mono-meta text-xs uppercase tracking-widest border-b border-[#1C1917] pb-0.5">
                Show Full Exhibition
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 mt-12">
              {filteredProducts.map((product, idx) => (
                <EditorialReveal key={product.id} delay={(idx % 3) * 90} className={idx % 3 === 1 ? 'lg:mt-10' : ''}>
                  <article className="group flex flex-col bg-[#FBF9F4] border border-[#1C1917]/12">
                    <div className="px-5 py-3 border-b border-[#1C1917]/10 flex items-center justify-between font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B]">
                      <span>{product.catalogNo}</span>
                      <span className={product.status === 'Available' ? 'text-[#1C1917]' : product.status === 'Sold' ? 'text-[#B54534]' : 'text-[#C28B37]'}>
                        {product.status}
                      </span>
                    </div>

                    <div onClick={() => setInspectProduct(product)} className="p-6 bg-[#ECE6DB]/55 cursor-pointer relative">
                      <div className="aspect-[4/5] bg-[#FBF9F4] p-2.5 border border-[#1C1917]/15 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[12px_20px_30px_rgba(28,25,23,0.16)]">
                        <div className="w-full h-full overflow-hidden border border-[#1C1917]/10">
                          <ArtPieceRenderer styleKey={product.styleKey} imageUrl={product.imageUrl} title={product.title} className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]" />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between border-t border-[#1C1917]/10">
                      <div>
                        <p className="font-mono-meta text-[10px] uppercase tracking-[0.16em] text-[#B54534]">{product.category}</p>
                        <h3 onClick={() => setInspectProduct(product)} className="font-serif-editorial text-2xl font-semibold text-[#1C1917] mt-1 cursor-pointer hover:text-[#B54534] transition-colors leading-snug">
                          {product.title}
                        </h3>
                        <p className="font-mono-meta text-[10px] text-[#6D645B] mt-2 uppercase">{product.dimensions}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#1C1917]/10 flex items-center justify-between gap-3">
                        <span className="font-mono-meta text-base font-medium text-[#1C1917]">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>

                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setInspectProduct(product)} className="font-mono-meta text-[11px] uppercase tracking-wider text-[#6D645B] hover:text-[#1C1917] transition-colors">
                            Inspect 3D
                          </button>
                          <span className="text-[#1C1917]/20">|</span>
                          {product.status === 'Available' ? (
                            <button type="button" onClick={() => addToBag(product)} className="font-mono-meta text-[11px] uppercase tracking-wider text-[#1C1917] font-medium hover:text-[#B54534] transition-colors">
                              Add to Bag
                            </button>
                          ) : (
                            <a href="#commissions" onClick={() => { setCommDepartment(product.department); setCommCategory(product.category); }} className="font-mono-meta text-[11px] uppercase tracking-wider text-[#B54534] font-medium hover:text-[#1C1917]">
                              Commission
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </EditorialReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. CUSTOM COMMISSION STUDIO (WIRED TO FIRESTORE + CLOUDINARY + WEB3FORMS + WHATSAPP) */}
      <section id="commissions" className="border-b border-[#1C1917]/12 bg-[#ECE6DB]/45">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1C1917]/12">
          <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-[0.22em] text-[#B54534]">BESPOKE STUDIO ORDERS</p>
              <h2 className="font-serif-editorial text-4xl sm:text-5xl font-medium text-[#1C1917] mt-3 leading-tight">Commission an Heirloom Piece</h2>
              <p className="font-sans-clean text-sm text-[#6D645B] mt-4 leading-relaxed">
                Whether translating a cherished family photograph into a charcoal portrait, painting a custom Jamini Roy tribute, or knitting a winter muffler and woolen bouquet in your chosen palette—every bespoke order is crafted directly in conversation with {settings.artistName}.
              </p>

              <ol className="mt-8 space-y-4 font-sans-clean text-xs text-[#1C1917] border-t border-[#1C1917]/12 pt-6">
                <li className="flex gap-4"><span className="font-mono-meta text-[#B54534]">01</span><span>Share your reference image, color notes, or gifting occasion.</span></li>
                <li className="flex gap-4"><span className="font-mono-meta text-[#B54534]">02</span><span>Receive studio progress photographs at sketch and finishing stages.</span></li>
                <li className="flex gap-4"><span className="font-mono-meta text-[#B54534]">03</span><span>Dispatched in archival flat-pack or linen gift wrapping within 7–12 days.</span></li>
              </ol>
            </div>

            <div className="mt-10 p-6 bg-[#FBF9F4] border border-[#1C1917]/15">
              <p className="font-mono-meta text-[10px] uppercase tracking-[0.2em] text-[#6D645B]">LIVE STUDIO ESTIMATE</p>
              <p className="font-mono-meta text-3xl text-[#1C1917] mt-1">₹{commissionEstimate.toLocaleString('en-IN')}</p>
              <p className="font-mono-meta text-[10px] text-[#6D645B] mt-1 uppercase">{commCategory} · {commSize}</p>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 bg-[#FBF9F4]">
            {commReceipt ? (
              <div className="h-full flex flex-col justify-center items-start py-12 max-w-md space-y-4">
                <p className="font-mono-meta text-xs uppercase tracking-[0.2em] text-[#B54534]">
                  INQUIRY LOGGED · {commReceipt.orderCode}
                </p>
                <h3 className="font-serif-editorial text-4xl font-medium text-[#1C1917]">
                  Thank you, {commReceipt.customerName}.
                </h3>
                <p className="font-sans-clean text-sm text-[#6D645B] leading-relaxed">
                  Your commission request (est. ₹{commReceipt.totalAmount.toLocaleString('en-IN')}) has been saved to the studio ledger and emailed to {settings.artistName}. Tap below to confirm timeline and UPI details on WhatsApp.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={buildWhatsAppLink(settings.whatsappNumber, commReceipt)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-widest transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirm on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => { setCommReceipt(null); setCommNotes(''); setCommRefFile(null); setCommRefPreview(''); }}
                    className="px-6 py-3 border border-[#1C1917] font-mono-meta text-xs uppercase tracking-widest hover:bg-[#1C1917] hover:text-[#F6F2EB] transition-colors"
                  >
                    New Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCommissionSubmit} className="space-y-6 font-sans-clean">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Department</label>
                    <select
                      value={commDepartment}
                      onChange={(e) => {
                        const d = e.target.value;
                        setCommDepartment(d);
                        const first = categories.find((c) => c.department === d);
                        if (first) setCommCategory(first.name);
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]"
                    >
                      <option value="Fine Art">Fine Art</option>
                      <option value="Woolen Craft">Woolen Craft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Category / Discipline</label>
                    <select value={commCategory} onChange={(e) => setCommCategory(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]">
                      {categories.filter((c) => c.department === commDepartment).map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Style / Yarn Palette</label>
                    <select value={commPalette} onChange={(e) => setCommPalette(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]">
                      <option>Charcoal & Warm Ivory</option>
                      <option>Jamini Mineral (Vermilion, Ochre, Indigo)</option>
                      <option>Dusty Rose & Raw Oatmeal Wool</option>
                      <option>Sage, Cream & Terracotta Yarn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Format / Scale</label>
                    <select value={commSize} onChange={(e) => setCommSize(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]">
                      <option>Small (8 × 10 IN / Petite)</option>
                      <option>Medium (12 × 16 IN / Standard)</option>
                      <option>Large (18 × 24 IN / Collector)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Reference Photograph (Optional)</label>
                  <label className="flex items-center justify-between gap-4 p-3.5 border border-dashed border-[#1C1917]/25 bg-[#F6F2EB] cursor-pointer hover:border-[#B54534] transition-colors">
                    <span className="inline-flex items-center gap-2.5 text-xs text-[#6D645B]">
                      <Upload className="w-4 h-4 text-[#1C1917]" />
                      <span>{commRefFile ? commRefFile.name : 'Upload portrait photo or palette swatch'}</span>
                    </span>
                    {commRefPreview && <img src={commRefPreview} alt="Commission reference" className="w-11 h-11 object-cover border border-[#1C1917]/20" />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setCommRefFile(f);
                        setCommRefPreview(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Your Name *</label>
                    <input type="text" required value={commName} onChange={(e) => setCommName(e.target.value)} placeholder="Riya Banerjee" className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]" />
                  </div>
                  <div>
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Email or WhatsApp *</label>
                    <input type="text" required value={commContact} onChange={(e) => setCommContact(e.target.value)} placeholder="+91 98XXX XXXXX" className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]" />
                  </div>
                </div>

                <div>
                  <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Notes & Occasion Date</label>
                  <textarea rows={3} value={commNotes} onChange={(e) => setCommNotes(e.target.value)} placeholder="Share framing preferences, wool shades, or desired delivery date..." className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/20 text-sm focus:outline-none focus:border-[#B54534]" />
                </div>

                <button type="submit" disabled={commSubmitting} className="w-full py-4 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-[0.2em] transition-colors disabled:opacity-50">
                  {commSubmitting ? 'Sending to Studio...' : `Request Commission — Est. ₹${commissionEstimate.toLocaleString('en-IN')}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. MINIMAL EDITORIAL FOOTER */}
      <footer className="bg-[#F6F2EB] py-14">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div>
            <p className="font-serif-editorial text-3xl tracking-[0.14em] font-semibold text-[#1C1917]">{settings.studioName}</p>
            <p className="font-mono-meta text-[11px] uppercase tracking-[0.18em] text-[#6D645B] mt-2">
              {settings.tagline} · BY {settings.artistName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono-meta text-[11px] uppercase tracking-[0.16em] text-[#6D645B]">
            <span>INSURED ART SHIPPING ACROSS INDIA</span>
            <span>·</span>
            <button type="button" onClick={() => setAdminOpen(true)} className="text-[#1C1917] hover:text-[#B54534] underline underline-offset-4">
              Admin Studio
            </button>
          </div>
        </div>
      </footer>

      {/* 8. 360° 3D STUDIO TURNTABLE MODAL */}
      {inspectProduct && (
        <StudioTurntableModal
          product={inspectProduct}
          artistName={settings.artistName}
          studioName={settings.studioName}
          onClose={() => setInspectProduct(null)}
          onAddToBag={addToBag}
        />
      )}

      {/* 9. SLIDE-OVER RECEIPT-STYLE EDITORIAL SHOPPING BAG */}
      {bagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1C1917]/55 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FBF9F4] h-full border-l border-[#1C1917]/20 flex flex-col justify-between">
            <div className="p-6 border-b border-[#1C1917]/15 flex items-center justify-between">
              <div>
                <p className="font-mono-meta text-[10px] uppercase tracking-[0.2em] text-[#6D645B]">STUDIO RECEIPT</p>
                <h3 className="font-serif-editorial text-2xl font-semibold text-[#1C1917]">Collector Bag [{bagCount}]</h3>
              </div>
              <button type="button" onClick={() => setBagOpen(false)} className="p-1.5 border border-[#1C1917]/15 hover:bg-[#1C1917] hover:text-[#F6F2EB]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {bagReceipt ? (
                <div className="py-10 border border-[#1C1917]/15 p-6 bg-[#F6F2EB] space-y-4">
                  <p className="font-mono-meta text-[11px] uppercase tracking-[0.2em] text-[#B54534]">
                    ORDER RESERVED · {bagReceipt.orderCode}
                  </p>
                  <h4 className="font-serif-editorial text-3xl text-[#1C1917]">Thank you for collecting.</h4>
                  <p className="font-sans-clean text-xs text-[#6D645B] leading-relaxed">
                    Your works are logged in the studio ledger and {settings.artistName} has been alerted. Confirm shipping & UPI payment on WhatsApp:
                  </p>
                  <a
                    href={buildWhatsAppLink(settings.whatsappNumber, bagReceipt)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-[11px] uppercase tracking-widest"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Confirm on WhatsApp</span>
                  </a>
                </div>
              ) : bag.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="font-serif-editorial text-2xl text-[#1C1917]">Your bag is empty.</p>
                  <p className="font-mono-meta text-[11px] uppercase text-[#6D645B] mt-2">Select an artwork or woolen piece to begin.</p>
                </div>
              ) : (
                <>
                  {bag.map(({ product, qty }) => (
                    <div key={product.id} className="flex gap-4 pb-5 border-b border-dashed border-[#1C1917]/20">
                      <div className="w-18 h-22 shrink-0 border border-[#1C1917]/15 bg-[#ECE6DB] p-1">
                        <ArtPieceRenderer styleKey={product.styleKey} imageUrl={product.imageUrl} title={product.title} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-mono-meta text-[10px] uppercase text-[#B54534]">{product.catalogNo} · {product.category}</p>
                          <h4 className="font-serif-editorial text-lg font-semibold text-[#1C1917] leading-snug">{product.title}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-mono-meta text-sm">₹{(Number(product.price) * qty).toLocaleString('en-IN')}</span>
                          <div className="inline-flex items-center border border-[#1C1917]/20">
                            <button type="button" onClick={() => updateBagQty(product.id, -1)} className="px-2 py-1 hover:bg-[#1C1917] hover:text-[#F6F2EB]"><Minus className="w-3 h-3" /></button>
                            <span className="px-3 font-mono-meta text-xs">{qty}</span>
                            <button type="button" onClick={() => updateBagQty(product.id, 1)} className="px-2 py-1 hover:bg-[#1C1917] hover:text-[#F6F2EB]"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-2">Handwritten Gift Note (Optional)</label>
                    <textarea rows={2} value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="Include a personal note on cotton card..." className="w-full p-3 bg-[#F6F2EB] border border-[#1C1917]/20 font-sans-clean text-xs focus:outline-none focus:border-[#B54534]" />
                  </div>
                </>
              )}
            </div>

            {bag.length > 0 && !bagReceipt && (
              <form onSubmit={handleBagCheckout} className="p-6 border-t border-[#1C1917]/15 bg-[#F6F2EB] space-y-3">
                <div className="flex items-baseline justify-between font-mono-meta">
                  <span className="text-xs uppercase text-[#6D645B]">Subtotal (INR)</span>
                  <span className="text-xl text-[#1C1917]">₹{bagSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <input required placeholder="Your Full Name *" value={bagCustomerName} onChange={(e) => setBagCustomerName(e.target.value)} className="w-full px-3 py-2 bg-[#FBF9F4] border border-[#1C1917]/20 text-xs" />
                <input required placeholder="WhatsApp / Phone Number *" value={bagCustomerContact} onChange={(e) => setBagCustomerContact(e.target.value)} className="w-full px-3 py-2 bg-[#FBF9F4] border border-[#1C1917]/20 text-xs" />
                <button type="submit" disabled={bagSubmitting} className="w-full py-3.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-[0.18em] transition-colors disabled:opacity-50">
                  {bagSubmitting ? 'Reserving...' : 'Confirm Studio Order'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 10. PASSWORD-PROTECTED ADMIN STUDIO DASHBOARD */}
      {adminOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/75 backdrop-blur-xs flex items-center justify-center p-4">
          {!adminUnlocked ? (
            <div className="bg-[#FBF9F4] border border-[#1C1917]/20 max-w-md w-full p-8 relative">
              <button type="button" onClick={() => { setAdminOpen(false); setPwError(''); }} className="absolute top-5 right-5 p-1.5 border border-[#1C1917]/15 hover:bg-[#1C1917] hover:text-[#F6F2EB]">
                <X className="w-4 h-4" />
              </button>

              <p className="font-mono-meta text-[10px] uppercase tracking-[0.22em] text-[#B54534]">RESTRICTED ACCESS</p>
              <h3 className="font-serif-editorial text-3xl font-semibold text-[#1C1917] mt-1">Admin Studio</h3>
              <p className="font-sans-clean text-xs text-[#6D645B] mt-2 leading-relaxed">
                Enter your private studio password to manage artworks, woolen crafts, categories, pricing, and live orders.
              </p>

              <form onSubmit={handleAdminUnlock} className="mt-6 space-y-4">
                <div>
                  <label className="block font-mono-meta text-[10px] uppercase tracking-[0.18em] text-[#6D645B] mb-1.5">Studio Password</label>
                  <input type="password" required value={pwInput} onChange={(e) => setPwInput(e.target.value)} placeholder="Enter password" className="w-full px-3.5 py-2.5 bg-[#F6F2EB] border border-[#1C1917]/25 font-mono-meta text-sm focus:outline-none focus:border-[#B54534]" />
                  {pwError && <p className="font-mono-meta text-[11px] text-[#B54534] mt-1.5">{pwError}</p>}
                </div>

                <button type="submit" className="w-full py-3.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-[0.18em] transition-colors">
                  Unlock Studio
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#F6F2EB] border border-[#1C1917]/25 max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#FBF9F4] px-6 py-4 border-b border-[#1C1917]/15 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono-meta text-[10px] uppercase tracking-[0.2em] text-[#B54534]">
                    {dbLive ? 'FIREBASE FIRESTORE · LIVE SYNC' : 'DEMO MODE · CONNECT FIREBASE TO SYNC'}
                  </p>
                  <h3 className="font-serif-editorial text-2xl font-semibold text-[#1C1917]">
                    {settings.studioName} — Admin Studio
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono-meta text-[11px] uppercase tracking-wider">
                  {isFirebaseConfigured && !dbLive && (
                    <button
                      type="button"
                      onClick={async () => { await seedFirestoreCatalog(); triggerNotice('Starter catalog seeded to Firestore'); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#B54534] text-[#B54534] hover:bg-[#B54534] hover:text-[#F6F2EB] transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Seed Demo to Firestore</span>
                    </button>
                  )}
                  <button type="button" onClick={() => { setAdminUnlocked(false); setAdminOpen(false); }} className="px-3.5 py-2 border border-[#1C1917]/20 hover:bg-[#1C1917] hover:text-[#F6F2EB] transition-colors">
                    Lock & Exit
                  </button>
                  <button type="button" onClick={() => setAdminOpen(false)} className="px-4 py-2 bg-[#1C1917] text-[#F6F2EB] hover:bg-[#B54534] transition-colors">
                    Return to Site
                  </button>
                </div>
              </div>

              <div className="px-6 bg-[#ECE6DB]/60 border-b border-[#1C1917]/12 flex flex-wrap gap-6 font-mono-meta text-xs uppercase tracking-[0.16em]">
                {[
                  { id: 'inventory', label: `Inventory & Works (${products.length})` },
                  { id: 'orders', label: `Orders & Commissions (${orders.length}${pendingOrdersCount ? ` · ${pendingOrdersCount} New` : ''})` },
                  { id: 'categories', label: `Categories (${categories.length})` },
                  { id: 'settings', label: 'Studio Settings' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAdminTab(t.id)}
                    className={`py-3.5 border-b-2 transition-colors ${adminTab === t.id ? 'border-[#B54534] text-[#1C1917] font-medium' : 'border-transparent text-[#6D645B] hover:text-[#1C1917]'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* TAB 1: INVENTORY */}
                {adminTab === 'inventory' && (
                  <div className="grid lg:grid-cols-12 gap-6">
                    <form onSubmit={handleSaveCreation} className="lg:col-span-5 bg-[#FBF9F4] border border-[#1C1917]/15 p-5 space-y-3.5 h-fit">
                      <div className="flex items-center justify-between border-b border-[#1C1917]/12 pb-3">
                        <h4 className="font-serif-editorial text-xl font-semibold">{editingId ? 'Edit Creation' : 'Add New Creation'}</h4>
                        {editingId && (
                          <button type="button" onClick={() => setEditingId(null)} className="font-mono-meta text-[10px] uppercase text-[#B54534] underline">Cancel</button>
                        )}
                      </div>

                      <input type="text" required value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} placeholder="Title *" className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={formState.department}
                          onChange={(e) => {
                            const d = e.target.value;
                            const first = categories.find((c) => c.department === d);
                            setFormState({ ...formState, department: d, category: first ? first.name : formState.category });
                          }}
                          className="w-full px-2.5 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs"
                        >
                          <option value="Fine Art">Fine Art</option>
                          <option value="Woolen Craft">Woolen Craft</option>
                        </select>

                        <select value={formState.category} onChange={(e) => setFormState({ ...formState, category: e.target.value })} className="w-full px-2.5 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs">
                          {categories.filter((c) => c.department === formState.department).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" required min="1" value={formState.price} onChange={(e) => setFormState({ ...formState, price: e.target.value })} placeholder="Price (₹ INR) *" className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 font-mono-meta text-xs" />
                        <select value={formState.status} onChange={(e) => setFormState({ ...formState, status: e.target.value })} className="w-full px-2.5 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs">
                          <option value="Available">Available</option>
                          <option value="Made to Order">Made to Order</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>

                      <input type="text" value={formState.dimensions} onChange={(e) => setFormState({ ...formState, dimensions: e.target.value })} placeholder="Dimensions (e.g. 14 × 18 IN · COTTON RAG)" className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 font-mono-meta text-xs" />
                      <input type="text" value={formState.material} onChange={(e) => setFormState({ ...formState, material: e.target.value })} placeholder="Medium / Material" className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />

                      <div className="grid grid-cols-2 gap-3">
                        <select value={formState.styleKey} onChange={(e) => setFormState({ ...formState, styleKey: e.target.value })} className="w-full px-2.5 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs">
                          <option value="portrait-sketching">Portrait Sketching</option>
                          <option value="jamini-roy">Jamini Roy Art</option>
                          <option value="abstract-drawing">Abstract Drawing</option>
                          <option value="indian-art">Indian Art</option>
                          <option value="muffler">Woolen Muffler</option>
                          <option value="key-rings">Woolen Key Rings</option>
                          <option value="flower-bouquet">Woolen Bouquet</option>
                        </select>

                        <label className="flex items-center justify-center gap-1.5 py-2 px-2 border border-dashed border-[#1C1917]/30 bg-[#F6F2EB] text-[11px] cursor-pointer hover:border-[#B54534]">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingPhoto ? 'Uploading...' : formState.imageUrl ? 'Photo Ready' : 'Upload Photo'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAdminPhotoUpload(e.target.files?.[0])} />
                        </label>
                      </div>

                      <textarea rows={2} value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} placeholder="Curatorial note..." className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />

                      <button type="submit" disabled={uploadingPhoto} className="w-full py-3 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-[0.18em] transition-colors disabled:opacity-50">
                        {editingId ? 'Save Changes' : 'Publish Creation'}
                      </button>
                    </form>

                    <div className="lg:col-span-7 bg-[#FBF9F4] border border-[#1C1917]/15 overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[#1C1917]/12 flex items-center justify-between">
                        <h4 className="font-serif-editorial text-xl font-semibold">Live Studio Inventory</h4>
                        <span className="font-mono-meta text-[10px] uppercase text-[#6D645B]">Inline ₹ Price & Status</span>
                      </div>

                      <div className="divide-y divide-[#1C1917]/10 max-h-[540px] overflow-y-auto">
                        {products.map((item) => (
                          <div key={item.id} className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-[#F6F2EB]/60">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-14 shrink-0 border border-[#1C1917]/15 bg-[#ECE6DB]">
                                <ArtPieceRenderer styleKey={item.styleKey} imageUrl={item.imageUrl} title={item.title} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-mono-meta text-[10px] text-[#B54534]">{item.catalogNo} · {item.category}</p>
                                <p className="font-serif-editorial text-lg font-semibold truncate">{item.title}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              <div className="flex items-center border border-[#1C1917]/20 bg-[#F6F2EB] px-2 py-1 font-mono-meta text-xs">
                                <span className="text-[#6D645B] mr-1">₹</span>
                                <input type="number" defaultValue={item.price} onBlur={(e) => handleInlinePrice(item.id, e.target.value)} className="w-16 bg-transparent focus:outline-none" />
                              </div>

                              <button type="button" onClick={() => handleCycleStatus(item)} className="px-2.5 py-1 border border-[#1C1917]/20 font-mono-meta text-[10px] uppercase hover:bg-[#1C1917] hover:text-[#F6F2EB] transition-colors">
                                {item.status}
                              </button>
                              <button type="button" onClick={() => handleEditStart(item)} className="p-1.5 border border-[#1C1917]/15 hover:bg-[#1C1917] hover:text-[#F6F2EB]"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => handleDeleteProduct(item.id)} className="p-1.5 border border-[#1C1917]/15 text-[#B54534] hover:bg-[#B54534] hover:text-[#F6F2EB]"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ORDERS & COMMISSIONS */}
                {adminTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="bg-[#FBF9F4] border border-[#1C1917]/15 p-12 text-center">
                        <p className="font-serif-editorial text-2xl">No orders or commissions yet.</p>
                        <p className="font-mono-meta text-xs text-[#6D645B] mt-1">New requests from the Bag or Commission Studio appear here in real time.</p>
                      </div>
                    ) : (
                      orders.map((o) => (
                        <div key={o.id} className="bg-[#FBF9F4] border border-[#1C1917]/15 p-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1 max-w-2xl">
                            <p className="font-mono-meta text-[10px] uppercase tracking-widest text-[#B54534]">
                              {o.orderCode} · {o.kind}
                            </p>
                            <h4 className="font-serif-editorial text-xl font-semibold">
                              {o.customerName} <span className="font-mono-meta text-xs font-normal text-[#6D645B]">({o.phone})</span>
                            </h4>
                            <p className="font-sans-clean text-xs text-[#6D645B]">{o.summary}</p>
                            {o.referenceImageUrl && (
                              <a href={o.referenceImageUrl} target="_blank" rel="noreferrer" className="inline-block font-mono-meta text-[11px] text-[#B54534] underline">
                                View Customer Reference Image
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono-meta text-sm">₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}</span>
                            <select
                              value={o.status}
                              onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-[#F6F2EB] border border-[#1C1917]/20 font-mono-meta text-[11px] uppercase"
                            >
                              {['Pending', 'Confirmed', 'In Progress', 'Shipped', 'Completed'].map((s) => <option key={s}>{s}</option>)}
                            </select>
                            <button type="button" onClick={() => removeOrder(o.id)} className="p-1.5 border border-[#1C1917]/15 text-[#B54534] hover:bg-[#B54534] hover:text-[#F6F2EB]">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: CATEGORIES */}
                {adminTab === 'categories' && (
                  <div className="grid md:grid-cols-12 gap-6">
                    <form onSubmit={handleAddCategory} className="md:col-span-5 bg-[#FBF9F4] border border-[#1C1917]/15 p-5 space-y-4 h-fit">
                      <h4 className="font-serif-editorial text-xl font-semibold border-b border-[#1C1917]/12 pb-2.5">Add Custom Category</h4>
                      <input type="text" required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g., Watercolor Botanicals or Crochet Shawls" className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />
                      <select value={newCatDept} onChange={(e) => setNewCatDept(e.target.value)} className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs">
                        <option value="Fine Art">Fine Art</option>
                        <option value="Woolen Craft">Woolen Craft</option>
                      </select>
                      <button type="submit" className="w-full py-3 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-[0.18em] transition-colors">Add Category</button>
                    </form>

                    <div className="md:col-span-7 bg-[#FBF9F4] border border-[#1C1917]/15 p-5">
                      <h4 className="font-serif-editorial text-xl font-semibold border-b border-[#1C1917]/12 pb-2.5 mb-4">Active Categories</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {categories.map((cat) => (
                          <div key={cat.id} className="p-3.5 bg-[#F6F2EB] border border-[#1C1917]/15 flex items-center justify-between">
                            <div>
                              <p className="font-sans-clean text-xs font-semibold text-[#1C1917]">{cat.name}</p>
                              <p className="font-mono-meta text-[10px] uppercase text-[#6D645B]">
                                {cat.department} · {products.filter((p) => p.category === cat.name).length} works
                              </p>
                            </div>
                            <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-[#B54534] hover:bg-[#B54534] hover:text-[#F6F2EB] border border-[#1C1917]/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: STUDIO SETTINGS */}
                {adminTab === 'settings' && (
                  <div className="max-w-xl bg-[#FBF9F4] border border-[#1C1917]/15 p-6 space-y-5">
                    <h4 className="font-serif-editorial text-2xl font-semibold border-b border-[#1C1917]/12 pb-3">Studio Identity & Security</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono-meta text-[10px] uppercase text-[#6D645B] mb-1">Studio Name</label>
                        <input type="text" value={settings.studioName} onChange={(e) => setSettings({ ...settings, studioName: e.target.value })} className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />
                      </div>
                      <div>
                        <label className="block font-mono-meta text-[10px] uppercase text-[#6D645B] mb-1">Artist Name</label>
                        <input type="text" value={settings.artistName} onChange={(e) => setSettings({ ...settings, artistName: e.target.value })} className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono-meta text-[10px] uppercase text-[#6D645B] mb-1">Artist Tagline</label>
                      <input type="text" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 text-xs" />
                    </div>
                    <div>
                      <label className="block font-mono-meta text-[10px] uppercase text-[#6D645B] mb-1">WhatsApp Number (91XXXXXXXXXX)</label>
                      <input type="text" value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} className="w-full px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 font-mono-meta text-xs" />
                    </div>
                    <button
                      type="button"
                      onClick={async () => { await saveStudioSettings(settings); triggerNotice('Studio settings saved'); }}
                      className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-wider"
                    >
                      Save Identity Settings
                    </button>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (newPasswordInput.trim().length < 4) return;
                        const updated = { ...settings, adminPassword: newPasswordInput.trim() };
                        setSettings(updated);
                        await saveStudioSettings(updated);
                        setNewPasswordInput('');
                        triggerNotice('Admin password updated');
                      }}
                      className="pt-5 border-t border-[#1C1917]/12 space-y-3"
                    >
                      <label className="block font-mono-meta text-[10px] uppercase text-[#6D645B]">Change Admin Studio Password</label>
                      <div className="flex gap-2">
                        <input type="text" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="New password (min 4 chars)" className="flex-1 px-3 py-2 bg-[#F6F2EB] border border-[#1C1917]/20 font-mono-meta text-xs" />
                        <button type="submit" className="px-5 py-2 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-mono-meta text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}