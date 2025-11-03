'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CreateLink() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setShortCode(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('links')
        .insert([
          {
            short_code: shortCode,
            destination_url: destinationUrl,
            title: title
          }
        ])
        .select();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Short code already exists. Generate a new one.');
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      // Success!
      router.push('/portal/links');
      
    } catch (err) {
      setError('Failed to create link');
      setLoading(false);
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-white mb-8">Create New Link</h2>

        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Link Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Amazon Product Link"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Destination URL
              </label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://amazon.com/your-affiliate-link"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value.toLowerCase())}
                  required
                  pattern="[a-z0-9]+"
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="abc123"
                />
                <button
                  type="button"
                  onClick={generateShortCode}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg"
                >
                  Generate
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Your link will be: znuost.com/l/{shortCode || 'abc123'}
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}