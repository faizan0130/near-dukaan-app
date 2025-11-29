'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Filter, IndianRupee, Calendar, User, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// ⭐ NEW IMPORT: secureApiCall ⭐
import { secureApiCall } from '@/lib/api';
// ⭐ NEW IMPORT: useAuth (needed for auth state check before fetching) ⭐
import { useAuth } from '@/lib/authContext';

// Types
interface Transaction {
    id: string;
    customerId: string;
    customerName: string;
    totalAmount: number;
    paymentType: 'cash' | 'credit' | 'payment';
    items: { name: string; quantity: number; price: number }[];
    notes: string;
    createdAt: string;
}

interface Summary {
    totalSales: number;
    totalPayments: number;
    netAmount: number;
}

const TransactionsListPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams(); // Needed for current page, wrapped in Suspense below
    const { loading: authLoading, user } = useAuth(); // NEW: Get auth status
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    
    // Summary Stats
    const [summary, setSummary] = useState<Summary>({
        totalSales: 0,
        totalPayments: 0,
        netAmount: 0
    });

    // Calculate Summary (Moved outside fetch for clarity)
    const calculateSummary = (txns: Transaction[]) => {
        const sales = txns
            .filter(t => t.paymentType === 'credit' || t.paymentType === 'cash')
            .reduce((sum, t) => sum + t.totalAmount, 0);
        
        const payments = txns
            .filter(t => t.paymentType === 'payment')
            .reduce((sum, t) => sum + t.totalAmount, 0);
        
        setSummary({
            totalSales: sales,
            totalPayments: payments,
            netAmount: sales - payments
        });
    };

    // Fetch Transactions (Function updated to be API-ready)
    const fetchTransactions = async () => {
        if (authLoading || !user) return; // Wait for auth and user
        
        setLoading(true);
        setError(null);
        try {
            // ⭐ FIX: Real API call integrated here (line 57 equivalent) ⭐
            // We pass filters as query parameters if needed later
            const data: Transaction[] = await secureApiCall('/transactions?limit=100', 'GET');
            
            setTransactions(data);
            calculateSummary(data);
        } catch (err: any) {
            setError('Transactions load nahi ho paye. Please check API connection.');
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // Initial Load & Filter Change Effect
    useEffect(() => {
        if (!authLoading && user) {
            fetchTransactions();
        }
    }, [authLoading, user, typeFilter, dateFilter]); // Added filters to trigger refetch

    // Filter Logic
    const filteredTransactions = transactions.filter(txn => {
        // Type Filter
        if (typeFilter !== 'all' && txn.paymentType !== typeFilter) return false;
        
        // Date Filter (Using existing logic, kept simple)
        if (dateFilter === 'today') {
            const today = new Date().toDateString();
            const txnDate = new Date(txn.createdAt).toDateString();
            if (today !== txnDate) return false;
        } else if (dateFilter === 'week') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (new Date(txn.createdAt).getTime() < weekAgo) return false;
        }
        
        return true;
    });

    // Format Date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
            return `Aaj, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Get Badge Color
    const getBadgeVariant = (type: string) => {
        switch(type) {
            case 'credit': return 'destructive';
            case 'cash': return 'default';
            case 'payment': return 'secondary';
            default: return 'outline';
        }
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'credit': return 'Udhaar';
            case 'cash': return 'Cash Sale';
            case 'payment': return 'Payment In';
            default: return type;
        }
    };

    // --- Loading State ---
    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading Transactions...</p>
            </div>
        );
    }
    
    // --- Render UI ---
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white shadow-sm p-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-600">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800 ml-4">Saare Transactions</h1>
                </div>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/transactions/new">
                        <Plus className="h-4 w-4 mr-1" /> Naya
                    </Link>
                </Button>
            </header>

            <main className="p-4 max-w-4xl mx-auto space-y-4">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2" /> {error}
                    </div>
                )}
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="pt-4 pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-green-700 font-medium mb-1">Total Sales</p>
                                    <p className="text-2xl font-bold text-green-800 flex items-center">
                                        <IndianRupee className="h-5 w-5" />
                                        {summary.totalSales.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="pt-4 pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-blue-700 font-medium mb-1">Payments In</p>
                                    <p className="text-2xl font-bold text-blue-800 flex items-center">
                                        <IndianRupee className="h-5 w-5" />
                                        {summary.totalPayments.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-600 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filter Karein
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">Type</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Saare</SelectItem>
                                    <SelectItem value="credit">Udhaar</SelectItem>
                                    <SelectItem value="cash">Cash Sale</SelectItem>
                                    <SelectItem value="payment">Payment In</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 font-medium mb-1 block">Time Period</label>
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Saare</SelectItem>
                                    <SelectItem value="today">Aaj</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions List */}
                <div className="space-y-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Transactions ({filteredTransactions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredTransactions.length === 0 ? (
                                <p className="p-4 text-center text-slate-500">Koi transaction nahi mila</p>
                            ) : (
                                filteredTransactions.map(txn => (
                                    <div 
                                        key={txn.id} 
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/customers/${txn.customerId}`)}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    <span className="font-semibold text-slate-800">{txn.customerName}</span>
                                                </div>
                                                <Badge variant={getBadgeVariant(txn.paymentType)} className="text-xs">
                                                    {getTypeLabel(txn.paymentType)}
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        {formatDate(txn.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={`text-lg font-bold flex items-center ${
                                                    txn.paymentType === 'payment' ? 'text-green-600' : 'text-slate-800'
                                                }`}>
                                                    <IndianRupee className="h-4 w-4" />
                                                    {txn.totalAmount.toLocaleString('en-IN')}
                                                </div>
                                            </div>

                                            {txn.items.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    <p className="text-xs text-slate-500">
                                                        Items: {txn.items.map(i => i.name).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

// Wrapper with Suspense
const TransactionsListWrapper = () => (
    // FIX: Suspense Boundary to prevent useSearchParams build crash
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading...</p>
        </div>
    }>
        <TransactionsListPage />
    </Suspense>
);

export default TransactionsListWrapper;