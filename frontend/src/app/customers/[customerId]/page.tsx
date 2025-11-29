'use client';

import AuthGuard from '@/lib/AuthGuard';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, Phone, Plus, Trash2, 
  MessageCircle, RefreshCw, ArrowDownLeft, ArrowUpRight, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { secureApiCall } from '@/lib/api';
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  due_balance: number;
  total_spent: number;
  createdAt?: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'payment' | 'cash';
  amount: number;
  notes: string;
  createdAt: any;
}

// --- HELPER COMPONENT: Transaction Row ---
const TransactionItem = ({ txn }: { txn: Transaction }) => {
  const isPayment = txn.type === 'payment';
  const isCredit = txn.type === 'credit';
  
  const dateDisplay = txn.createdAt?.toDate 
    ? txn.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
    : 'N/A';

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Icon based on Type */}
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isPayment ? 'bg-emerald-100 text-emerald-600' : 
            isCredit ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
        }`}>
            {isPayment ? <ArrowDownLeft className="h-5 w-5" /> : 
             isCredit ? <ArrowUpRight className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
        </div>

        <div>
           <p className="text-sm font-semibold text-slate-900">
             {isPayment ? 'Payment Received' : isCredit ? 'Udhaar Added' : 'Cash Sale'}
           </p>
           <p className="text-xs text-slate-500">
             {dateDisplay} • <span className="italic">{txn.notes || 'No notes'}</span>
           </p>
        </div>
      </div>

      <div className="text-right">
         <span className={`text-sm font-bold ${
            isPayment ? 'text-emerald-600' : isCredit ? 'text-red-600' : 'text-slate-600'
         }`}>
            {isPayment ? '+' : isCredit ? '-' : ''} ₹{txn.amount.toLocaleString('en-IN')}
         </span>
         {isPayment && <Badge variant="outline" className="ml-2 hidden sm:inline-block text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>}
         {isCredit && <Badge variant="outline" className="ml-2 hidden sm:inline-block text-[10px] bg-red-50 text-red-700 border-red-200">Due</Badge>}
      </div>
    </div>
  );
};

// ------------------ MAIN PAGE ------------------
const CustomerDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  
  const { user, loading: authLoading } = useAuth(); 

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Fetch Data ---
  const fetchCustomerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerData: Customer = await secureApiCall(`/customers/${customerId}`, 'GET');
      setCustomer(customerData);

      const transactionsData: Transaction[] = await secureApiCall(`/transactions/${customerId}`, 'GET');
      setTransactions(transactionsData);

    } catch (err: any) {
      console.error("Failed to fetch customer data:", err);
      setError("Customer data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (authLoading) return; 
    if (!user) {
        setIsLoading(false);
        return;
    }
    if (customerId) fetchCustomerData();
  }, [customerId, fetchCustomerData, user, authLoading]);


  // --- Actions ---
  const handleCall = () => {
    if (customer?.phone) window.location.href = `tel:${customer.phone}`;
  };
  
  const triggerWhatsAppChat = () => {
    if (!customer || customer.due_balance <= 0 || !customer.phone) return;

    const dueAmount = customer.due_balance || 0;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountryCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const shopName = "Near Dukaan"; 

    const message = `नमस्ते ${customer.name},%0A%0A` +
        `आपके *${shopName}* पर कुल *₹${dueAmount.toLocaleString()}* का उधार बाकी है।%0A%0A` +
        `कृपया भुगतान करें। धन्यवाद।`;

    window.open(`https://wa.me/${phoneWithCountryCode}?text=${message}`, '_blank');
  };
  
  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      await secureApiCall(`/customers/${customerId}`, 'DELETE');
      router.replace('/customers');
    } catch (err) {
       alert("Delete failed.");
       setIsDeleting(false);
    }
  };

  // --- Loading / Error States ---
  if (isLoading || authLoading) { 
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Loading Details...</p>
       </div>
    );
  }

  if (error || !customer) {
    return (
        <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-red-600">Error</CardTitle>
                    <CardDescription>{error || "Customer not found."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.back()} variant="outline">Go Back</Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const dueAmount = customer.due_balance || 0;
  const initials = customer.name.substring(0, 2).toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pb-12">
        
        {/* ================= HEADER ================= */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold text-slate-800">Customer Details</h1>
                </div>
                {/* Desktop Edit Button */}
                <Button variant="ghost" size="sm" className="hidden md:flex text-slate-500">
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
            </div>
        </header>

        {/* ================= MAIN CONTENT GRID ================= */}
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                
                {/* ---------------- LEFT COLUMN (Sticky Profile) ---------------- */}
                <div className="md:col-span-1 space-y-6">
                    
                    {/* Profile Card */}
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="px-6 pb-6 relative">
                            <Avatar className="h-20 w-20 border-4 border-white absolute -top-10 shadow-sm bg-white">
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold text-slate-900 capitalize">{customer.name}</h2>
                                <p className="text-slate-500 text-sm font-medium flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" /> {customer.phone}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Dues Summary Card */}
                    <Card className={`border-0 shadow-md ${dueAmount > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'}`}>
                        <CardContent className="p-6">
                            <p className="text-sm opacity-90 font-medium">Current Balance</p>
                            <h3 className="text-4xl font-extrabold mt-1 tracking-tight">
                                ₹ {dueAmount.toLocaleString('en-IN')}
                            </h3>
                            <p className="text-xs mt-2 opacity-80">
                                {dueAmount > 0 ? 'Customer ko paise dene hain.' : 'Hisab barabar hai.'}
                            </p>
                            
                            {/* WhatsApp Button */}
                            {dueAmount > 0 && (
                                <Button 
                                    onClick={triggerWhatsAppChat}
                                    className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0 font-semibold"
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Reminder
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons (Grid) */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={handleCall} className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            <Phone className="h-4 w-4 mr-2" /> Call
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete <b>{customer.name}</b> and all their transaction history. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
                                        {isDeleting ? 'Deleting...' : 'Delete Customer'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* ---------------- RIGHT COLUMN (Transactions) ---------------- */}
                <div className="md:col-span-2">
                    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
                        
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Transaction History</CardTitle>
                                <CardDescription>Last {transactions.length} activities</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="ghost" size="icon" onClick={fetchCustomerData} disabled={isLoading}>
                                    <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none">
                                    <Link href={`/transactions/new?customerId=${customerId}`}>
                                        <Plus className="h-4 w-4 mr-2" /> New Entry
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="flex-1 bg-white rounded-b-xl overflow-hidden min-h-[300px]">
                            {transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                                        <Wallet className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p>No transactions found.</p>
                                    <p className="text-xs">Add a new entry to start tracking.</p>
                                </div>
                            ) : (
                                <div className="bg-white">
                                    {transactions.map((txn) => (
                                        <TransactionItem key={txn.id} txn={txn} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default CustomerDetailPage;