'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode) => {
    const url = `${window.location.origin}/l/${shortCode}`;
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      loadLinks(); // Reload
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">znuost</h1>
          <Link href="/portal" className="text-gray-400 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">All Links</h2>
          <Link
            href="/portal/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            + Create New
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : links.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
            <p className="text-gray-400 mb-4">No links yet!</p>
            <Link
              href="/portal/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Create Your First Link
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                    <p className="text-gray-400 text-sm mb-2 break-all">{link.destination_url}</p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => copyToClipboard(link.short_code)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        znuost.com/l/{link.short_code} (Copy)
                      </button>
                      <span className="text-gray-500 text-sm">
                        {link.total_clicks} clicks
                      </span>
                      <span className={`text-sm ${link.active ? 'text-green-400' : 'text-red-400'}`}>
                        {link.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/portal/analytics/${link.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={() => toggleActive(link.id, link.active)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                    >
                      {link.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}