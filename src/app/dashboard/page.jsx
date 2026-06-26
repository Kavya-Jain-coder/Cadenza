'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EmptyState from '@/components/dashboard/EmptyState';
import CreationCard from '@/components/dashboard/CreationCard';
import VoiceCalibration from '@/components/ui/VoiceCalibration';
import Toast from '@/components/ui/Toast';
import DashboardScene from '@/components/3d/DashboardScene';
import FeatureShowcase from '@/components/dashboard/FeatureShowcase';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('all'); 
  const [creations, setCreations] = useState({ lyrics: [], instrumentals: [], tracks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Stage 2: Feature Showcase (Scrollytelling track)
  const showcaseRef = useRef(null);
  const { scrollYProgress: showcaseScroll } = useScroll({
    target: showcaseRef,
    offset: ["start start", "end end"]
  });

  // Stage 3: Catalog Transition
  // We track when the showcase FINISHES to drop the 3D model down.
  // "end end" = when bottom of showcase hits bottom of screen (catalog starts appearing)
  // "end start" = when bottom of showcase hits top of screen (catalog fully covers screen)
  const { scrollYProgress: catalogScroll } = useScroll({
    target: showcaseRef,
    offset: ["end end", "end start"]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  const fetchCreations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/creations', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/auth');
        return;
      }
      const data = await res.json();
      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
      } else {
        setCreations(data);
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('Failed to connect to studio index');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCreations();
    }
  }, [status]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const items = getFilteredItems();
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set()); // deselect all
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const items = getFilteredItems();
    const itemsToDelete = items.filter(i => selectedIds.has(i.id));
    if (itemsToDelete.length === 0) return;

    const prevCreations = { ...creations };
    const newCreations = { ...creations };
    
    newCreations.lyrics = newCreations.lyrics.filter(i => !selectedIds.has(i.id));
    newCreations.instrumentals = newCreations.instrumentals.filter(i => !selectedIds.has(i.id));
    newCreations.tracks = newCreations.tracks.filter(i => !selectedIds.has(i.id));
    
    setCreations(newCreations);
    setSelectedIds(new Set());
    setToastType('success');
    setToastMessage(`Deleted ${itemsToDelete.length} item${itemsToDelete.length > 1 ? 's' : ''}`);

    try {
      await Promise.all(itemsToDelete.map(item => 
        fetch(`/api/creations?id=${item.id}&type=${item.type}`, { method: 'DELETE' })
      ));
    } catch (e) {
      console.error("Bulk delete failed", e);
    }
  };

  const handleDelete = async (id, type) => {
    // Optimistic UI update
    const prevCreations = { ...creations };
    const newCreations = { ...creations };
    
    if (type === 'lyric') {
      newCreations.lyrics = newCreations.lyrics.filter(item => item.id !== id);
    } else if (type === 'instrumental') {
      newCreations.instrumentals = newCreations.instrumentals.filter(item => item.id !== id);
    } else if (type === 'track') {
      newCreations.tracks = newCreations.tracks.filter(item => item.id !== id);
    }
    
    setCreations(newCreations);
    setToastType('success');
    setToastMessage('Item deleted');

    try {
      const res = await fetch(`/api/creations?id=${id}&type=${type}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        setCreations(prevCreations);
        setToastType('error');
        setToastMessage(data.error);
      }
    } catch (e) {
      setCreations(prevCreations);
      setToastType('error');
      setToastMessage('Unable to complete deletion');
    }
  };

  const hasCreations = creations.lyrics.length > 0 || creations.instrumentals.length > 0 || creations.tracks.length > 0;

  const getFilteredItems = () => {
    const items = [];
    if (activeTab === 'all' || activeTab === 'lyrics') {
      creations.lyrics.forEach((item) => items.push({ ...item, type: 'lyric' }));
    }
    if (activeTab === 'all' || activeTab === 'instrumentals') {
      creations.instrumentals.forEach((item) => items.push({ ...item, type: 'instrumental' }));
    }
    if (activeTab === 'all' || activeTab === 'tracks') {
      creations.tracks.forEach((item) => items.push({ ...item, type: 'track' }));
    }
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const filteredItems = getFilteredItems();

  const tabs = [
    { id: 'all', label: 'All Audio & Text' },
    { id: 'lyrics', label: 'Lyrics Only' },
    { id: 'instrumentals', label: 'Instrumental Beats' },
    { id: 'tracks', label: 'Final Mixes' }
  ];

  return (
    <div className="relative w-full">
      
      {/* 3D Background - reacts to both showcase and catalog scroll */}
      <DashboardScene showcaseScroll={showcaseScroll} catalogScroll={catalogScroll} />
      
      {/* Massive Ambient Radial Gradient for Depth */}
      <div className="fixed top-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_60%)] blur-3xl pointer-events-none -z-10" />

      {/* MAIN CONTENT LAYER */}
      <div className="relative z-10 w-full">
        
        {/* =========================================
            STAGE 1: THE VOCAL STUDIO
           ========================================= */}
        <div 
          className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-7xl mx-auto w-full pb-20"
          style={{ paddingTop: '20vh' }}
        >
          
          {/* Header Title */}
          <div className="mb-12 text-center select-none">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] tracking-[0.3em] font-mono text-theme-400 uppercase mb-3 block"
            >
              Step 1
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-white via-theme-200 to-theme-500 tracking-wide pb-2 drop-shadow-[0_0_15px_rgba(var(--dyn-theme-500),0.3)]"
            >
              Calibrate Your Voice
            </motion.h1>
          </div>

          {/* Massive Voice Calibration Widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-5xl"
          >
            <VoiceCalibration />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex flex-col items-center opacity-50"
          >
            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 mb-2">Scroll to explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-theme-500 to-transparent" />
          </motion.div>
        </div>

        {/* =========================================
            STAGE 2: FEATURE SHOWCASE (Scrollytelling)
           ========================================= */}
        <FeatureShowcase showcaseRef={showcaseRef} scrollYProgress={showcaseScroll} />

        {/* =========================================
            STAGE 3: THE CATALOG
           ========================================= */}
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col pt-32 pb-24">
          <div className="mb-12 select-none">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[10px] tracking-[0.3em] font-mono text-theme-400 uppercase mb-3 block"
            >
              Your Sonic Catalog
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl text-white tracking-wide pb-2"
            >
              Recent Creations
            </motion.h2>
          </div>

          {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : !hasCreations ? (
          <div className="flex-grow flex items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            
            {/* Redesigned Pill Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-2">
              <div className="flex overflow-x-auto gap-2 md:gap-3 hide-scrollbar">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-6 py-3 rounded-full text-[11px] font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap z-10 glass hover:theme-glow-hover ${
                        isActive ? 'text-white font-bold border-theme-400/50 shadow-[0_0_20px_rgba(var(--dyn-theme-500),0.3)]' : 'text-zinc-400 border-white/5'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activePillTab"
                          className="absolute inset-0 bg-theme-500/20 rounded-full -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {filteredItems.length > 0 && (
                <div className="flex items-center gap-3 self-end md:self-auto">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono tracking-widest uppercase hover:bg-red-500/30 hover:text-red-300 transition-colors flex items-center gap-2"
                    >
                      Delete Selected ({selectedIds.size})
                    </button>
                  )}
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 rounded-full bg-white/5 text-zinc-300 border border-white/10 text-[10px] font-mono tracking-widest uppercase hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Creations Grid */}
            {filteredItems.length === 0 ? (
              <div className="py-24 flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No items in this category
                </span>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, idx) => (
                    <motion.div
                      layout
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.05 }}
                    >
                      <CreationCard
                        creation={item}
                        type={item.type}
                        onDelete={handleDelete}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={handleToggleSelect}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </div>
      {/* END MAIN CONTENT LAYER */}
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}
