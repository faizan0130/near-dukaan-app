'use client';

// ⭐ FIX: Added missing React import for createElement
import React, { useState, useEffect, useCallback } from 'react';

import AuthGuard from '@/lib/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, MessageCircle, AlertTriangle, IndianRupee, Clock, Package, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { secureApiCall } from '@/lib/api'; 
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS ⭐
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- TYPES ---
interface Reminder {
    id: string;
    // Backend Queue se aane wala data
    type: string; // Will come as 'Payment Due', 'Inventory Expiry', etc.
    customerName?: string; 
    itemName?: string;
    amountDue?: number;
    status: string;
    createdAt: any;
    customerId?: string; // Used for linking to customer detail
}

// --- HELPER COMPONENT: Reminder Card (Upgraded Shadcn Look) ---
const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const isPaymentDue = reminder.type.includes('Payment');
    const isInventoryAlert = reminder.type.includes('Inventory') || reminder.type.includes('Stock');
    
    let icon: React.FC<any> = IndianRupee;
    let titleColor: string = 'text-red-700';
    let link: string = reminder.customerId ? `/customers/${reminder.customerId}` : '/reminders'; 
    let detailText: string;

    if (isPaymentDue) {
        icon = IndianRupee;
        titleColor = 'text-red-700';
        detailText = `₹${reminder.amountDue?.toLocaleString('en-IN') || 'N/A'} due from ${reminder.customerName || 'customer'}.`;
    } else if (isInventoryAlert) {
        icon = Package;
        titleColor = 'text-orange-700';
        link = '/inventory'; 
        detailText = `Item: ${reminder.itemName || 'Product'}. Status: ${reminder.status}`;
    } else {
        icon = AlertTriangle;
        titleColor = 'text-slate-600';
        detailText = `Action Required. Status: ${reminder.status}`;
    }


    return (
        <Link 
            href={link} 
        >
            <Card className={`group shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 ${isPaymentDue ? 'border-red-400' : 'border-orange-400'} bg-white hover:bg-slate-50`}>
                <CardContent className="p-4 flex justify-between items-center">
                    
                    {/* Left: Icon, Title, Detail */}
                    <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`p-2 rounded-full ${isPaymentDue ? 'bg-red-50' : 'bg-orange-50'} flex-shrink-0 mt-1`}>
                            {React.createElement(icon, { className: `h-5 w-5 ${titleColor}` })}
                        </div>
                        <div className="min-w-0">
                            <h3 className={`text-base font-semibold ${titleColor} truncate`}>
                                {reminder.type}
                            </h3>
                            <p className="text-sm text-slate-900 font-medium mt-0.5">
                                {reminder.customerName || reminder.itemName || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {detailText}
                            </p>
                        </div>
                    </div>

                    {/* Right: Action Button/Badge */}
                    <div className="flex items-center gap-2">
                         <Badge variant="secondary" className={`text-xs ${isPaymentDue ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                            {reminder.status}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-400" />
                    </div>

                </CardContent>
            </Card>
        </Link>
    );
};

// --- Main Reminders Page Component (Integrated) ---
const RemindersPage = () => {
    const { loading: authLoading } = useAuth();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch data from the API
    const fetchReminders = useCallback(async () => {
        if (authLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const data: Reminder[] = await secureApiCall('/notifications', 'GET');
            
            // Map the data to include display logic 
            const mappedReminders = data.map(item => ({
                ...item,
                type: item.type || 'Payment Due', 
                amountDue: item.amountDue || 0,
                customerId: item.customerId, 
                itemName: item.itemName || 'N/A',
                status: item.status || 'Pending', 
            }));

            setReminders(mappedReminders);
        } catch (err: any) {
            console.error("Failed to fetch reminders:", err);
            setError("Reminders list load nahi ho payi. (Missing Index or API Issue)"); 
        } finally {
            setIsLoading(false);
        }
    }, [authLoading]);

    // Fetch data on component load
    useEffect(() => {
        if (!authLoading) {
            fetchReminders();
        }
    }, [authLoading, fetchReminders]);


    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading Alerts...</p>
            </div>
        );
    }
    
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
                
                {/* Header Section (Matching other pages) */}
                <header className="sticky top-0 z-20 bg-white shadow-sm p-4 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 p-1 -ml-1">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <h1 className="text-xl font-bold text-slate-800">Alerts & Reminders</h1>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchReminders} disabled={isLoading} className='text-slate-500'>
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                        </Button>
                    </div>
                </header>

                {/* Reminder List */}
                <main className="p-4 max-w-7xl mx-auto space-y-4">
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-3 font-medium">
                        <span className="flex items-center">
                             <AlertTriangle className="h-4 w-4 mr-2" />
                            {error ? 'Error loading alerts' : `Showing ${reminders.length} reminder requests.`}
                        </span>
                    </div>

                    {error && (
                         <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {reminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} />
                        ))}
                    </div>
                    
                    {reminders.length === 0 && !isLoading && !error && (
                        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                            <p className='text-slate-900 font-semibold'>Abhi koi naya alert ya reminder request queue mein nahi hai.</p>
                            <p className='text-slate-500 text-sm'>Aapka stock aur udhaar sab theek hai.</p>
                        </div>
                    )}
                </main>

                <BottomNav />
            </div>
        </AuthGuard>
    );
};

export default RemindersPage;