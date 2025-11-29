'use client';

import AuthGuard from '@/lib/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { Search, PackagePlus, ArrowLeft, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { secureApiCall } from '@/lib/api';
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS ⭐
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for inventory data received from the API
interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    sellingPrice: number;
    expiryDate: string | null;
}

// --- Expiry Status Logic (Remains the same) ---
const getExpiryStatus = (dateString: string | null) => {
    if (!dateString) {
        return { status: 'N/A', color: 'text-slate-500', icon: Clock, bg: 'bg-slate-100' };
    }
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'Expired', color: 'text-red-600', icon: AlertTriangle, bg: 'bg-red-100' };
    } else if (diffDays <= 30) {
        return { status: `${diffDays} days left`, color: 'text-orange-600', icon: Clock, bg: 'bg-yellow-100' };
    } else {
        return { status: 'Stable', color: 'text-emerald-600', icon: CheckCircle, bg: 'bg-emerald-100' };
    }
};

// --- Inventory Card Component (Upgraded Shadcn Look) ---
const InventoryCard = ({ item }: { item: InventoryItem }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);
    const Icon = expiryStatus.icon;
    
    // Low stock logic (Placeholder threshold: < 10)
    const isLowStock = item.quantity < 10; 

    return (
        <Link 
            href={`/inventory/${item.id}/edit`} 
        >
            <Card className="shadow-sm hover:shadow-md hover:border-indigo-200 transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                    
                    {/* Left: Product Info & Stock Status */}
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-base font-semibold text-slate-800 truncate hover:text-indigo-600">
                            {item.name}
                        </h3>
                        <p className={`text-sm mt-1 font-medium flex items-center gap-1 ${isLowStock ? 'text-red-500' : 'text-slate-600'}`}>
                            <PackagePlus className='h-4 w-4' />
                            Stock: {item.quantity} 
                            {isLowStock && <Badge variant="destructive" className='ml-1 h-5'>Low!</Badge>}
                        </p>
                    </div>
                    
                    {/* Right: Expiry Status */}
                    <div className="flex flex-col items-end text-sm pl-2">
                        <p className="text-xs text-slate-500">Price: ₹{item.sellingPrice.toLocaleString('en-IN')}</p>
                        <Badge 
                            variant="secondary" 
                            className={`flex items-center mt-1 text-xs ${expiryStatus.color.replace('text-', 'text-')}`}
                            style={{ backgroundColor: expiryStatus.bg }}
                        >
                            <Icon className="h-3 w-3 mr-1" />
                            <span className="font-semibold">{expiryStatus.status}</span>
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

// Loading Skeleton
const InventoryListSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
    </div>
);


// --- Main Inventory Page Component ---
const InventoryPage = () => {
    const { loading: authLoading } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Function to fetch data from the API
    const fetchInventory = useCallback(async () => {
        if (authLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const data: InventoryItem[] = await secureApiCall('/inventory', 'GET');
            setInventory(data);
        } catch (err: any) {
            console.error("Failed to fetch inventory:", err);
            setError("Inventory list load nahi ho payi. Please check API connection.");
        } finally {
            setIsLoading(false);
        }
    }, [authLoading]);

    // Fetch data on component load and when auth is ready
    useEffect(() => {
        if (!authLoading) {
            fetchInventory();
        }
    }, [authLoading, fetchInventory]);

    // Simple search/filter logic
    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // --- Render UI ---
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
                
                {/* Header Section (Matching Customer List Header) */}
                <header className="sticky top-0 z-20 bg-white shadow-sm p-4 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
                        
                        {/* Title & Back Button (Mobile only) */}
                        <div className="flex items-center justify-between w-full md:w-auto">
                             <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 p-1 -ml-1">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <h1 className="text-xl font-bold text-slate-800 flex-1 text-center md:hidden">Shop Inventory</h1>
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-8 text-xs md:hidden">
                                <Link href="/inventory/new">
                                     <PackagePlus className="h-3 w-3 mr-1" /> Add
                                </Link>
                            </Button>
                        </div>
                        
                        {/* Desktop Search & Controls */}
                        <div className="flex items-center w-full md:w-auto gap-3">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search item name or code..."
                                    className="w-full pl-10 pr-4 bg-white border-slate-200 shadow-sm"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <Button variant="outline" size="icon" onClick={fetchInventory} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                            </Button>
                            
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-9 text-sm hidden md:flex">
                                <Link href="/inventory/new">
                                     <PackagePlus className="h-4 w-4 mr-2" /> Naya Stock Jodein
                                </Link>
                            </Button>
                        </div>

                    </div>
                </header>

                {/* Inventory List */}
                <main className="p-4 max-w-7xl mx-auto space-y-4">
                     <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Current Stock ({filteredInventory.length})
                     </h2>
                     
                    {error && (
                         <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    
                    {isLoading || authLoading ? (
                        <InventoryListSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInventory.map(item => (
                                <InventoryCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    {!isLoading && filteredInventory.length === 0 && !error && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <div className="bg-indigo-50 p-4 rounded-full mb-4">
                                <PackagePlus className="h-8 w-8 text-indigo-400" />
                            </div>
                            <p className="text-slate-900 font-semibold">Abhi koi Stock item nahi hai.</p>
                            <Link href="/inventory/new" className="mt-3 inline-block text-indigo-600 font-medium hover:underline">
                                Naya Stock Jodein
                            </Link>
                        </div>
                    )}
                </main>

                <BottomNav />
            </div>
        </AuthGuard>
    );
};

export default InventoryPage;