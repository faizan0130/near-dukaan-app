'use client';
import BottomNav from '@/components/BottomNav'; // <-- NEW IMPORT
import AuthGuard from '@/lib/AuthGuard';
import { useAuth } from '@/lib/authContext';
import { 
  IndianRupee, Users, Package, AlertTriangle, RefreshCw, 
  Menu, LogOut, Home, PlusCircle, Settings, 
  ChevronRight, Search, Bell
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { secureApiCall } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth'; // Ensure correct import
import { auth } from '@/lib/firebase';

// ⭐ SHADCN IMPORTS
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- COMPONENTS ---

// 1. Sidebar Item (Desktop)
const SidebarItem = ({ icon: Icon, label, href, active }: any) => (
  <Link 
    href={href} 
    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
    {label}
  </Link>
);

// 2. Mobile Bottom Nav Item
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

// 3. Stats Card (Hero)
const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
                {title}
            </CardTitle>
            <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
                 <Icon className={`h-4 w-4 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <p className="text-xs text-slate-400 mt-1">{trend}</p>
        </CardContent>
    </Card>
);


// ------------------ MAIN PAGE ------------------
const HomePage = () => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname(); // To detect active page

    const [metrics, setMetrics] = useState({
        totalOutstandingDues: 0,
        activeCustomerCount: 0,
        itemsLowInStock: 0,
        expiryAlerts: 0,
    });
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const displayName = user?.email?.split('@')[0] || "Shopkeeper";
    const fullDisplayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    // --- Logout Logic ---
    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };

    // --- Fetch Metrics ---
    const fetchMetrics = useCallback(async () => {
        if (authLoading) return;
        setIsLoadingMetrics(true);
        try {
            const data = await secureApiCall('/dashboard/metrics', 'GET');
            setMetrics(data);
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setIsLoadingMetrics(false);
        }
    }, [authLoading]);

    useEffect(() => {
        if (!authLoading) fetchMetrics();
    }, [authLoading, fetchMetrics]);


    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-slate-50">
                
                {/* ===================================================
                    🖥️ DESKTOP SIDEBAR (Fixed Left)
                   =================================================== */}
                <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed inset-y-0 z-50">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                         <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
                             <Package className="h-5 w-5 text-white" />
                         </div>
                         <span className="text-lg font-bold text-white tracking-wide">Near Dukaan</span>
                    </div>

                    {/* Navigation Links */}
                    <ScrollArea className="flex-1 py-6 px-3">
                        <nav className="space-y-1">
                            <SidebarItem icon={Home} label="Dashboard" href="/dashboard" active={true} />
                            <SidebarItem icon={Users} label="Customers & Udhaar" href="/customers" />
                            <SidebarItem icon={Package} label="Inventory Stock" href="/inventory" />
                            <SidebarItem icon={IndianRupee} label="Transactions" href="/transactions" />
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tools</p>
                            </div>
                            <SidebarItem icon={AlertTriangle} label="Expiry Alerts" href="/reminders" />
                            <SidebarItem icon={Settings} label="Settings" href="/settings" />
                        </nav>
                    </ScrollArea>

                    {/* User Profile & Logout (Bottom Aligned) */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10 border-2 border-slate-600">
                                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                    {fullDisplayName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{fullDisplayName}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="w-full justify-start text-red-200 hover:text-white hover:bg-red-600/90"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Log Out
                        </Button>
                    </div>
                </aside>


                {/* ===================================================
                    📱 + 🖥️ MAIN CONTENT AREA
                   =================================================== */}
                <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                    
                    {/* --- HEADER (Sticky) --- */}
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm md:px-8 justify-between">
                        
                        {/* Mobile: Hamburger & Logo */}
                        <div className="flex items-center gap-2 md:hidden">
                            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-6 w-6 text-slate-700" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] bg-slate-900 text-white border-r-slate-800 p-0">
                                    <SheetHeader className="p-6 border-b border-slate-800 text-left">
                                        <SheetTitle className="text-white flex items-center gap-2">
                                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                                <Package className="h-5 w-5 text-white" />
                                            </div>
                                            Near Dukaan
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="py-4">
                                         {/* Mobile Sidebar Links Same as Desktop */}
                                         <nav className="space-y-1 px-2">
                                            <SidebarItem icon={Home} label="Dashboard" href="/dashboard" active={true} />
                                            <SidebarItem icon={Users} label="Customers" href="/customers" />
                                            <SidebarItem icon={Package} label="Inventory" href="/inventory" />
                                            <SidebarItem icon={AlertTriangle} label="Alerts" href="/reminders" />
                                        </nav>
                                    </div>
                                    <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                                         <Button variant="destructive" className="w-full" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" /> Log Out
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <span className="font-bold text-indigo-700 text-lg">Near Dukaan</span>
                        </div>

                        {/* Desktop Search Bar */}
                        <div className="hidden md:flex items-center w-full max-w-md relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input 
                                type="search" 
                                placeholder="Search customers, items..." 
                                className="w-full bg-slate-50 pl-9 focus-visible:ring-indigo-500" 
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500" onClick={fetchMetrics}>
                                <RefreshCw className={`h-5 w-5 ${isLoadingMetrics ? 'animate-spin text-indigo-600' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500">
                                <Bell className="h-5 w-5" />
                            </Button>
                             {/* Mobile Profile Avatar (Click to go to settings/profile) */}
                             <Link href="/settings" className="md:hidden">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">{fullDisplayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                        </div>
                    </header>

                    {/* --- DASHBOARD CONTENT --- */}
                    <ScrollArea className="flex-1 p-4 md:p-8 bg-slate-50 pb-24 md:pb-8">
                        <div className="max-w-6xl mx-auto space-y-8">
                            
                            {/* 1. HERO SECTION: Full Display */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-xl">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <p className="text-indigo-100 font-medium mb-1">Total Market Udhaar (Receivables)</p>
                                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                            ₹ {isLoadingMetrics ? '...' : metrics.totalOutstandingDues.toLocaleString('en-IN')}
                                        </h1>
                                        <p className="mt-2 text-sm text-indigo-200 flex items-center gap-1">
                                            <TrendingUpIcon className="h-4 w-4" /> 
                                            Market mein paisa fasa hua hai
                                        </p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold flex-1 md:flex-none shadow-lg border-0">
                                            <PlusCircle className="mr-2 h-4 w-4" /> New Sale
                                        </Button>
                                        <Button variant="outline" className="bg-indigo-500/20 text-white border-indigo-400 hover:bg-indigo-500/40 flex-1 md:flex-none">
                                            Add Customer
                                        </Button>
                                    </div>
                                </div>
                                {/* Background Decoration */}
                                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 blur-3xl" />
                            </div>

                            {/* 2. STATS GRID */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {isLoadingMetrics ? (
                                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
                                ) : (
                                    <>
                                        <StatCard 
                                            title="Active Customers" 
                                            value={metrics.activeCustomerCount} 
                                            icon={Users} 
                                            colorClass="bg-blue-500 text-blue-500" 
                                            trend="Regular buyers"
                                        />
                                        <StatCard 
                                            title="Low Stock Items" 
                                            value={metrics.itemsLowInStock} 
                                            icon={Package} 
                                            colorClass="bg-orange-500 text-orange-500" 
                                            trend="Reorder needed"
                                        />
                                        <StatCard 
                                            title="Expiry Alerts" 
                                            value={metrics.expiryAlerts} 
                                            icon={AlertTriangle} 
                                            colorClass="bg-red-500 text-red-500" 
                                            trend="Next 30 days"
                                        />
                                        <StatCard 
                                            title="Today's Sales" 
                                            value="₹ 0" 
                                            icon={IndianRupee} 
                                            colorClass="bg-green-500 text-green-500" 
                                            trend="Track daily"
                                        />
                                    </>
                                )}
                            </div>

                            {/* 3. RECENT ACTIVITY PREVIEW (Optional but fills space well) */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        <Link href="/customers/new" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Users className="h-5 w-5"/></div>
                                            <span className="font-medium text-sm text-slate-700">Add Customer</span>
                                        </Link>
                                        <Link href="/inventory/new" className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                                            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Package className="h-5 w-5"/></div>
                                            <span className="font-medium text-sm text-slate-700">Add Product</span>
                                        </Link>
                                        <Link href="/transactions/new" className="col-span-2 flex items-center justify-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 group">
                                            <div className="bg-indigo-200 p-2 rounded-full text-indigo-700 group-hover:scale-110 transition-transform"><IndianRupee className="h-5 w-5"/></div>
                                            <span className="font-bold text-sm text-indigo-700">Record New Payment / Sale</span>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-sm flex flex-col justify-center items-center p-8 text-center bg-slate-50/50">
                                    <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                        <RefreshCw className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-medium">No Recent Transactions</h3>
                                    <p className="text-slate-500 text-sm mt-1">Aaj ka hisab-kitab yahan dikhega.</p>
                                </Card>
                            </div>

                        </div>
                    </ScrollArea>

                    {/* ===================================================
                        📱 MOBILE BOTTOM NAV (Fixed)
                       =================================================== */}
                    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 px-2 py-1 pb-safe z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <MobileNavItem icon={Home} label="Home" href="/dashboard" active={true} />
                        <MobileNavItem icon={Users} label="Customers" href="/customers" />
                        
                        {/* Center FAB (Floating Action Button) Look */}
                        <div className="relative -top-5">
                            <Link href="/transactions/new" className="h-14 w-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center text-white hover:scale-105 transition-transform border-4 border-slate-50">
                                <PlusCircle className="h-7 w-7" />
                            </Link>
                        </div>

                        <MobileNavItem icon={Package} label="Stock" href="/inventory" />
                        
                        {/* Menu Trigger for Mobile Profile/Logout */}
                         <div className="w-full flex justify-center">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="flex flex-col items-center justify-center w-full py-2 text-slate-400 hover:text-slate-600">
                                        <Menu className="h-6 w-6" />
                                        <span className="text-[10px] font-medium mt-1">Menu</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="right">
                                    <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
                                    <div className="flex flex-col gap-4 mt-6">
                                        <Link href="/profile" className="flex items-center gap-3 p-2 rounded hover:bg-slate-100">
                                            <Avatar><AvatarFallback>{fullDisplayName.charAt(0)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-bold">{fullDisplayName}</p>
                                                <p className="text-xs text-slate-500">Edit Profile</p>
                                            </div>
                                        </Link>
                                        <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                         </div>
                    </div>

                </main>
            </div>
        </AuthGuard>
    );
};

// Helper Icon Component
function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export default HomePage;