'use client';

import AuthGuard from '@/lib/AuthGuard';
import BottomNav from '@/components/BottomNav'; // ⭐ Uses the fixed BottomNav
import { useAuth } from '@/lib/authContext';
import { 
  Search, UserPlus, ArrowLeft, RefreshCw, 
  Users, Phone, ChevronRight, Package 
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { secureApiCall } from '@/lib/api';
import { usePathname } from 'next/navigation';

// ⭐ SHADCN IMPORTS
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  due_balance: number;
}

// ------------------ Customer Card ------------------
const CustomerCard = ({ customer }: { customer: Customer }) => {
  const dueAmount = customer.due_balance || 0;
  const isDue = dueAmount > 0;
  
  const initials = customer.name.substring(0, 2).toUpperCase();

  return (
    <Link href={`/customers/${customer.id}`}>
      <Card className="group border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          
          {/* Left: Avatar & Info */}
          <div className="flex items-center gap-4 overflow-hidden">
            <Avatar className="h-12 w-12 border border-slate-100 bg-slate-50">
              <AvatarFallback className={`font-bold ${isDue ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 bg-slate-100'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                {customer.name}
              </h3>
              <div className="flex items-center text-xs text-slate-500 mt-0.5">
                <Phone className="h-3 w-3 mr-1" />
                {customer.phone}
              </div>
            </div>
          </div>

          {/* Right: Balance & Status */}
          <div className="text-right pl-2">
            <p className="text-xs text-slate-500 mb-1">Balance</p>
            {isDue ? (
               <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold text-sm px-2 py-0.5 whitespace-nowrap">
                 ₹ {dueAmount.toLocaleString()}
               </Badge>
            ) : (
               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold text-sm px-2 py-0.5 whitespace-nowrap">
                 Settled
               </Badge>
            )}
          </div>
          
          {/* Mobile Chevron */}
          <ChevronRight className="h-5 w-5 text-slate-300 ml-2 hidden sm:block group-hover:text-indigo-400" />

        </CardContent>
      </Card>
    </Link>
  );
};

// Loading Skeleton
const CustomerListSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-xl bg-white">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-8 w-16" />
            </div>
        ))}
    </div>
);

// ------------------ MAIN PAGE ------------------
const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user, loading: authLoading } = useAuth();
  const displayName = user?.email?.split('@')[0] || "User";
  const pathname = usePathname();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: Customer[] = await secureApiCall('/customers', 'GET');
      setCustomers(data);
    } catch (err: any) {
      console.error("Failed to fetch customers:", err);
      setError("Customer list load nahi ho payi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setIsLoading(false);
        return;
    }
    fetchCustomers();
  }, [fetchCustomers, user, authLoading]);

  // Filter Logic
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Helper for Desktop Nav Link
  const TopNavLink = ({ label, href, active }: any) => (
    <Link href={href} className={`text-sm font-medium transition-colors hover:text-indigo-600 ${active ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
        {label}
    </Link>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        
        {/* ===================================================
            HEADER (Matches Screenshot Style)
           =================================================== */}
        <header className="sticky top-0 z-30 w-full border-b bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* LEFT: Logo/Back & Title */}
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Mobile: Back Button */}
                    <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>

                    {/* Desktop: Logo */}
                    <Link href="/dashboard" className="hidden md:flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-indigo-700 text-lg">Near Dukaan</span>
                    </Link>

                    {/* Desktop: Nav Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        <TopNavLink label="Dashboard" href="/dashboard" active={pathname === '/dashboard'} />
                        <TopNavLink label="Customers" href="/customers" active={pathname === '/customers'} />
                        <TopNavLink label="Inventory" href="/inventory" active={pathname === '/inventory'} />
                        <TopNavLink label="Transactions" href="/transactions" active={pathname === '/transactions'} />
                    </nav>

                    {/* Mobile: Page Title */}
                    <h1 className="text-lg font-bold text-slate-800 md:hidden">Customers</h1>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-3">
                    {/* Desktop Search */}
                    <div className="hidden md:block relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Search name..." 
                            className="pl-9 h-9 bg-slate-50" 
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button variant="ghost" size="icon" onClick={fetchCustomers} className="text-slate-500">
                         <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                    </Button>

                    <Link href="/settings">
                        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-90">
                            <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                                {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </header>

        {/* ===================================================
            MAIN CONTENT
           =================================================== */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
            
            {/* Mobile Search Bar */}
            <div className="mb-6 md:hidden relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search by name or phone..." 
                    className="pl-10 bg-white border-slate-200 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats / Info Bar */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    All Parties ({filteredCustomers.length})
                </h2>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-8 text-xs">
                    <Link href="/customers/new">
                        <UserPlus className="h-3 w-3 mr-1" /> Add New
                    </Link>
                </Button>
            </div>

            {/* ERROR STATE */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center mb-6">
                    <RefreshCw className="h-4 w-4 mr-2" /> {error}
                </div>
            )}

            {/* LIST */}
            {isLoading && !error ? (
                <CustomerListSkeleton />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map(customer => (
                        <CustomerCard key={customer.id} customer={customer} />
                    ))}
                    
                    {!isLoading && filteredCustomers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <div className="bg-indigo-50 p-4 rounded-full mb-4">
                                <Users className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Koi Customer Nahi Mila</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-1 mb-6">
                                {searchTerm ? 'Search term change karke dekhein.' : 'Aapka customer list khali hai. Pehla customer jodein.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

        </main>

        {/* ===================================================
            MOBILE BOTTOM NAV
           =================================================== */}
        <BottomNav />

      </div>
    </AuthGuard>
  );
};

export default CustomersPage;   