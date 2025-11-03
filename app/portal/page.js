'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Portal() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    clicksToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if logged in
    const isAuth = localStorage.getItem('znuost_auth');
    if (!isAuth) {
      router.push('/');
      return;
    }
    
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total links
      const { count: linksCount } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true });

      // Get total clicks
      const { count: clicksCount } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true });

      // Get clicks today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .gte('clicked_at', today.toISOString());

      setStats({
        totalLinks: linksCount || 0,
        totalClicks: clicksCount || 0,
        clicksToday: todayCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('znuost_auth');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">znuost</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-white mb-8">Dashboard</h2>

        {loading ? (
          <p className="text-gray-400">Loading stats...</p>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Total Links</p>
                <p className="text-4xl font-bold text-white">{stats.totalLinks}</p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Total Clicks</p>
                <p className="text-4xl font-bold text-white">{stats.totalClicks}</p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Clicks Today</p>
                <p className="text-4xl font-bold text-white">{stats.clicksToday}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Link
                href="/portal/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
              >
                + Create New Link
              </Link>
              
              <Link
                href="/portal/links"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                View All Links
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}