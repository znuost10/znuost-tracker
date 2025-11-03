'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = (e) => {
    e.preventDefault();
    
    if (username === 'znuost' && password === 'znuost2024') {
      localStorage.setItem('znuost_auth', 'true');
      router.push('/portal');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#181A18] flex items-center justify-center p-8">
      <div className="max-w-md w-full"> 
      <div className="w-full">
          
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-gray-600 text-[#E8E8E8] px-0 py-3 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-gray-600 text-[#E8E8E8] px-0 py-3 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                placeholder="Enter password"
              />
            </div>
            
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full bg-transparent border-2 border-blue-600 hover:border-blue-500 text-[#E8E8E8] font-bold py-3 rounded-lg transition-all mt-6"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}