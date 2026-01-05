// app/page.js
'use client'
import { useState } from 'react';
import { registerDomainAndUser } from './actions';

export default function Home() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(event.target);
    const result = await registerDomainAndUser(formData);

    setLoading(false);
    
    if (result.success) {
      setStatus({ type: 'success', msg: result.message });
      event.target.reset(); 
    } else {
      setStatus({ type: 'error', msg: result.message });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-500 mb-2">Mail SaaS Admin</h1>
          <p className="text-zinc-400 text-sm">Create domains and email accounts instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Domain Input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Target Domain</label>
            <input 
              name="domain" 
              type="text" 
              placeholder="example.com"
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              required 
            />
          </div>

          {/* User Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Username</label>
              <input 
                name="username" 
                type="text" 
                placeholder="info"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Password</label>
              <input 
                name="password" 
                type="password" 
                placeholder="******"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded-lg transition-all"
          >
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        {status && (
          <div className={`mt-6 p-4 rounded-lg text-sm border ${
            status.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 
            'bg-red-900/20 border-red-800 text-red-400'
          }`}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}