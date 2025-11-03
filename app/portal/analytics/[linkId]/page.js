'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage({ params }) {
  const [link, setLink] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    deviceBreakdown: {},
    browserBreakdown: {},
    osBreakdown: {},
    referrerBreakdown: {},
    countryBreakdown: {},
    cityBreakdown: {}
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const linkId = (await params).linkId;
      
      // Get link details
      const { data: linkData, error: linkError } = await supabase
        .from('links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (linkError) throw linkError;
      setLink(linkData);

      // Get all clicks for this link
      const { data: clicksData, error: clicksError } = await supabase
        .from('clicks')
        .select('*')
        .eq('link_id', linkId)
        .order('clicked_at', { ascending: false });

      if (clicksError) throw clicksError;
      setClicks(clicksData || []);

      // Calculate stats
      const deviceBreakdown = {};
      const browserBreakdown = {};
      const osBreakdown = {};
      const referrerBreakdown = {};
      const countryBreakdown = {};
      const cityBreakdown = {};

      clicksData?.forEach(click => {
        deviceBreakdown[click.device_type] = (deviceBreakdown[click.device_type] || 0) + 1;
        browserBreakdown[click.browser] = (browserBreakdown[click.browser] || 0) + 1;
        osBreakdown[click.os] = (osBreakdown[click.os] || 0) + 1;
        countryBreakdown[click.country] = (countryBreakdown[click.country] || 0) + 1;
        cityBreakdown[click.city] = (cityBreakdown[click.city] || 0) + 1;
        
        const ref = click.referrer === 'direct' ? 'Direct' : new URL(click.referrer).hostname;
        referrerBreakdown[ref] = (referrerBreakdown[ref] || 0) + 1;
      });

      setStats({
        totalClicks: clicksData?.length || 0,
        deviceBreakdown,
        browserBreakdown,
        osBreakdown,
        referrerBreakdown,
        countryBreakdown,
        cityBreakdown
      });

      // Prepare chart data (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          clicks: 0
        });
      }

      clicksData?.forEach(click => {
        const clickDate = new Date(click.clicked_at);
        clickDate.setHours(0, 0, 0, 0);
        const dayIndex = Math.floor((Date.now() - clickDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          last7Days[6 - dayIndex].clicks++;
        }
      });

      setChartData(last7Days);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Link not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">znuost</h1>
          <Link href="/portal/links" className="text-gray-400 hover:text-white text-sm">
            ← Back to Links
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Link Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{link.title}</h2>
          <p className="text-gray-400 text-sm mb-2">znuost.com/l/{link.short_code}</p>
          <p className="text-gray-500 text-sm break-all">{link.destination_url}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Total Clicks</p>
            <p className="text-4xl font-bold text-white">{stats.totalClicks}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Top Device</p>
            <p className="text-2xl font-bold text-white capitalize">
              {Object.keys(stats.deviceBreakdown)[0] || 'N/A'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Top Location</p>
            <p className="text-2xl font-bold text-white">
              {Object.keys(stats.countryBreakdown)[0] || 'N/A'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Top Browser</p>
            <p className="text-2xl font-bold text-white">
              {Object.keys(stats.browserBreakdown)[0] || 'N/A'}
            </p>
          </div>
        </div>

        {/* Click Trend Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Click Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Location Breakdown */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Top Countries</h3>
            {Object.entries(stats.countryBreakdown).slice(0, 5).map(([country, count]) => (
              <div key={country} className="flex items-center justify-between mb-3">
                <span className="text-gray-300">{country}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.totalClicks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* City Breakdown */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Top Cities</h3>
            {Object.entries(stats.cityBreakdown).slice(0, 5).map(([city, count]) => (
              <div key={city} className="flex items-center justify-between mb-3">
                <span className="text-gray-300">{city}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.totalClicks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Device Breakdown */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Device Breakdown</h3>
            {Object.entries(stats.deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between mb-3">
                <span className="text-gray-300 capitalize">{device}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.totalClicks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Browser Breakdown */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Browser Breakdown</h3>
            {Object.entries(stats.browserBreakdown).map(([browser, count]) => (
              <div key={browser} className="flex items-center justify-between mb-3">
                <span className="text-gray-300">{browser}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.totalClicks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clicks Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Recent Clicks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Browser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">OS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clicks.map((click) => (
                  <tr key={click.id}>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {click.city}, {click.country}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 capitalize">{click.device_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{click.browser}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{click.os}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{click.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}