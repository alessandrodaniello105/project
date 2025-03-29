import { Music2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@cama.leoni',
      password: 'camaleoni',
    });
    if (error) console.error('Error signing in:', error);
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({
      email: 'test@cama.leoni',
      password: 'camaleoni',
    });
    if (error) console.error('Error signing up:', error);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-96">
      <div className="flex items-center justify-center mb-6">
        <Music2 className="w-12 h-12 text-indigo-600" />
      </div>
      <h1 className="text-2xl font-bold text-center mb-6">Musician Manager</h1>
      <div className="space-y-4">
        <button
          onClick={handleSignIn}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
        >
          Sign In
        </button>
        <button
          onClick={handleSignUp}
          className="w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  </div>
  );
}