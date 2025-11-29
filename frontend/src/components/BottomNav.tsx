'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Package, PlusCircle, Menu, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// ⭐ SHADCN IMPORTS
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Helper Component for Nav Items
const MobileNavItem = ({ icon: Icon, label, href, active }: any) => (
  <Link 
    href={href} 
    className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
      active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon className={`h-6 w-6 ${active ? 'fill-current' : ''}`} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </Link>
);

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Active logic
  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const displayName = user?.email?.split('@')[0] || "Shopkeeper";
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      
      {/* Top Shadow for depth */}
      <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

      {/* Main Navbar Container */}
      <nav className="relative bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end h-16 px-2">
          
          {/* 1. HOME */}
          <MobileNavItem 
            icon={Home} 
            label="Home" 
            href="/dashboard" 
            active={isActive('/dashboard')} 
          />

          {/* 2. CUSTOMERS */}
          <MobileNavItem 
            icon={Users} 
            label="Customers" 
            href="/customers" 
            active={isActive('/customers')} 
          />
          
          {/* 3. CENTER FAB (Floating Action Button) - The one you liked! */}
          <div className="relative -top-5 flex justify-center w-full">
            <Link 
                href="/transactions/new" 
                className="h-14 w-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center text-white hover:scale-105 transition-transform border-4 border-slate-50"
            >
                <PlusCircle className="h-7 w-7" />
            </Link>
          </div>

          {/* 4. STOCK */}
          <MobileNavItem 
            icon={Package} 
            label="Stock" 
            href="/inventory" 
            active={isActive('/inventory')} 
          />
          
          {/* 5. MENU (Sheet Trigger) */}
          <div className="w-full flex justify-center">
            <Sheet>
                <SheetTrigger asChild>
                    <button className={`flex flex-col items-center justify-center w-full py-2 text-slate-400 hover:text-slate-600 ${isActive('/settings') ? 'text-indigo-600' : ''}`}>
                        <Menu className="h-6 w-6" />
                        <span className="text-[10px] font-medium mt-1">Menu</span>
                    </button>
                </SheetTrigger>
                
                {/* --- MENU DRAWER --- */}
                <SheetContent side="right" className="w-[300px] p-0 flex flex-col bg-white">
                    <SheetHeader className="p-6 bg-slate-50 border-b border-slate-100 text-left">
                        <SheetTitle className="text-xl font-bold text-slate-900">Menu</SheetTitle>
                        <div className="flex items-center gap-3 mt-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                    {formattedName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-slate-900">{formattedName}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[180px]">{user?.email}</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 py-4 px-2">
                        <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">
                            <UserCircle className="h-5 w-5 text-slate-400" /> My Profile
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">
                            <Settings className="h-5 w-5 text-slate-400" /> Settings
                        </Link>
                    </div>

                    <div className="p-4 border-t border-slate-100 pb-8">
                        <Button 
                            variant="destructive" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" /> Log Out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
          </div>

        </div>
      </nav>
    </div>
  );
};

export default BottomNav;