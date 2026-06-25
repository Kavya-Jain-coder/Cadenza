'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EmptyState from '@/components/dashboard/EmptyState';
import CreationCard from '@/components/dashboard/CreationCard';
import VoiceCalibration from '@/components/ui/VoiceCalibration';
import Toast from '@/components/ui/Toast';
import DashboardScene from '@/components/3d/DashboardScene';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('all'); 
  const [creations, setCreations] = useState({ lyrics: [], instrumentals: [], tracks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  const handleDelete = async (id, type) => {
    try {
      const res = await fetch(`/api/creations?id=${id}&type=${type}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
      } else {
        setToastType('success');
        setToastMessage('Item deleted successfully');
        fetchCreations();
      }
    } catch (e) {
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
    <div className="min-h-screen p-4 md:p-8 relative pt-40 md:pt-48 pb-24 flex-grow flex flex-col justify-start overflow-hidden">
      
      <DashboardScene />
      
      {/* Massive Ambient Radial Gradient for Depth */}
      <div className="fixed top-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_60%)] blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex-grow flex flex-col">
        {/* Header Title */}
        <div className="mb-12 select-none">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase mb-3 block"
          >
            Creations Hub
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-6xl text-white tracking-wide"
          >
            Your Sonic Catalog
          </motion.h1>
        </div>

        {/* Voice Calibration Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <VoiceCalibration />
        </motion.div>

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
            <div className="flex overflow-x-auto gap-2 md:gap-3 select-none pb-2 hide-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-2.5 rounded-full text-[11px] font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap z-10 ${
                      isActive ? 'text-black font-bold' : 'text-zinc-500 hover:text-zinc-300 border border-white/5 bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePillTab"
                        className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {tab.label}
                  </button>
                );
              })}
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
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
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
