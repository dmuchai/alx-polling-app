import Link from 'next/link';
import { useSupabase } from '@/components/auth/session-provider';
import { useRouter } from 'next/navigation';


export default function Navbar() {
  const { session, supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="w-full bg-white shadow mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-xl">
          <Link href="/dashboard">Polling App</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/polls" className="hover:underline">Polls</Link>
          <Link href="/polls/create" className="hover:underline">Create Poll</Link>
          {session ? (
            <button onClick={handleLogout} className="hover:underline">Logout</button>
          ) : (
            <>
              <Link href="/(auth)/login" className="hover:underline">Login</Link>
              <Link href="/(auth)/register" className="hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
