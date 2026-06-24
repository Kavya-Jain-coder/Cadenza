'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import EmptyState from '@/components/dashboard/EmptyState';
import CreationCard from '@/components/dashboard/CreationCard';
import VoiceCalibration from '@/components/ui/VoiceCalibration';
import Toast from '@/components/ui/Toast';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'lyrics' | 'instrumentals' | 'tracks'
  const [creations, setCreations] = useState({ lyrics: [], instrumentals: [], tracks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  const fetchCreations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/creations');
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
      const res = await fetch(`/api/creations?id=${id}&type=${type}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
      } else {
        setToastType('success');
        setToastMessage('Item deleted successfully');
        // Refresh local cache
        fetchCreations();
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('Unable to complete deletion');
    }
  };

  const hasCreations =
    creations.lyrics.length > 0 ||
    creations.instrumentals.length > 0 ||
    creations.tracks.length > 0;

  // Filter creation items
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

    // Sort by created_at descending
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
    <div className="min-h-screen p-4 md:p-8 relative py-24 flex-grow flex flex-col justify-start">
      <BackgroundImage route="/dashboard" />
      <GoldWaveSVG speedMultiplier={0.3} density={2} />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex-grow flex flex-col">
        {/* Header Title */}
        <div className="mb-8 select-none">
          <span className="text-[10px] tracking-[0.25em] font-mono text-gold-400 uppercase mb-2 block">
            Creations Hub
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-white tracking-wide">
            Your Sonic Catalog
          </h1>
        </div>

        {/* Voice Calibration Widget */}
        <div className="mb-10">
          <VoiceCalibration />
        </div>

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
          </div>
        ) : !hasCreations ? (
          <div className="flex-grow flex items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex border-b border-white/5 pb-2 overflow-x-auto gap-2 md:gap-4 select-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 px-1 text-[10px] font-mono tracking-widest uppercase transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id ? 'text-gold-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeDashboardTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-400"
                      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Creations Grid */}
            {filteredItems.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-xl bg-void/10">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No items in this category
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredItems.map((item, idx) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: idx * 0.05 }}
                  >
                    <CreationCard
                      creation={item}
                      type={item.type}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </div>
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
