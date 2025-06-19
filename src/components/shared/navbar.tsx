
"use client";

import Link from 'next/link';
import { Newspaper, UserCircle, LogIn, LogOut, UserPlus, UserCheck, Settings } from 'lucide-react'; // Added UserCheck, Settings
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length -1][0]).toUpperCase();
    }
    return name.substring(0,2).toUpperCase();
  };

  return (
    // Updated header to use card styling for consistent Neubrutalism
    <header className="bg-card shadow-md sticky top-0 z-50 py-3 border-b-3 border-black">
      <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
          {/* <Newspaper className="h-10 w-10 text-primary" /> */}
          <h1 className="text-3xl md:text-4xl font-bold neu-brutal-header bg-newsmania-yellow text-black">
            NewsMania
          </h1>
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          {loading ? (
            <div className="h-10 w-24 bg-muted rounded animate-pulse neu-brutal"></div>
          ) : user ? (
            <div className="flex items-center gap-2 md:gap-3">
                <span 
                    className="neu-brutal bg-newsmania-green text-black p-2 px-3 md:px-4 flex items-center gap-2 text-sm md:text-base cursor-pointer neu-brutal-hover"
                    onClick={() => router.push('/profile')}
                >
                    <UserCheck size={20} /> <span className="hidden sm:inline" >{user.name.split(' ')[0]}</span>
                </span>
                <Button 
                    onClick={logout} 
                    variant="default"
                    className="neu-brutal bg-newsmania-red text-black hover:bg-red-400 p-2 px-3 md:px-4 neu-brutal-hover neu-brutal-active"
                >
                    <LogOut size={18} className="md:mr-1" /> <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="default" 
                onClick={() => router.push('/register')}
                className="neu-brutal bg-newsmania-purple text-black hover:bg-purple-400 p-2 px-3 md:px-4 neu-brutal-hover neu-brutal-active"
              >
                <UserPlus size={18} className="md:mr-1" /> <span className="hidden sm:inline">Register</span>
              </Button>
              <Button 
                variant="default" 
                onClick={() => router.push('/login')}
                className="neu-brutal bg-newsmania-blue text-black hover:bg-blue-400 p-2 px-3 md:px-4 neu-brutal-hover neu-brutal-active"
              >
                <LogIn size={18} className="md:mr-1" /> <span className="hidden sm:inline">Login</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
