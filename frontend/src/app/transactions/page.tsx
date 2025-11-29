'use client';

import AuthGuard from '@/lib/AuthGuard';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Plus, Save, Trash2, IndianRupee, RefreshCw, 
  UserCheck, PlusCircle, CreditCard, Banknote, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { secureApiCall } from '@/lib/api'; 
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const NewTransactionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth(); 

  // Data States
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(true);

  // Form States
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'credit' | 'cash' | 'payment'>('credit');
  const [items, setItems] = useState<Item[]>([{ id: 1, name: '', quantity: 1, price: 0, total: 0 }]);
  const [paymentAmount, setPaymentAmount] = useState<string>(''); // Using string for easier input handling
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  
  // --- Fetch Customers ---
  const fetchCustomers = useCallback(async () => {
    if(authLoading) return;
    setCustomerLoading(true);
    try {
      const data: Customer[] = await secureApiCall('/customers', 'GET');
      setAllCustomers(data);
      
      const initialId = searchParams.get('customerId');
      if (initialId) {
        const customer = data.find(c => c.id === initialId);
        if (customer) setCustomerId(customer.id);
      }
    } catch (err: any) {
      console.error("Failed to fetch customers:", err);
      setError("Customer list load nahi ho payi.");
    } finally {
      setCustomerLoading(false);
    }
  }, [authLoading, searchParams]);

  useEffect(() => {
    if (!authLoading) fetchCustomers();
  }, [authLoading, fetchCustomers]);


  // --- Logic ---
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const updateItem = (id: number, field: keyof Item, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = (updated.quantity || 0) * (updated.price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems(prev => [...prev, { id: newId, name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // --- Submit ---
  const handleSubmit = async () => {
    setError(null);

    if (!customerId) {
        setError("Please select a customer first.");
        return;
    }
    
    const finalAmount = paymentType === 'payment' ? parseFloat(paymentAmount) : grandTotal;
    
    if (!finalAmount || finalAmount <= 0) {
        setError("Amount must be greater than zero.");
        return;
    }

    setIsLoading(true);

    const transactionData = {
        customerId,
        totalAmount: finalAmount,
        paymentType,
        items: paymentType !== 'payment' ? items.filter(i => i.name) : [], 
        notes: paymentType === 'payment' ? 'Payment received' : 'Purchase',
    };

    try {
        await secureApiCall('/transactions', 'POST', transactionData);
        router.push(`/customers/${customerId}`);
    } catch (err: any) {
        console.error("Txn Error:", err);
        setError(err.message || "Transaction failed.");
    } finally {
        setIsLoading(false);
    }
  };


  if (authLoading || customerLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading...</p>
        </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pb-32">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-16 flex items-center gap-3 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-indigo-600">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold text-slate-800">Record Transaction</h1>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
            
            {/* 1. Customer Selection */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Select Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={customerId} onValueChange={setCustomerId} disabled={allCustomers.length === 0}>
                        <SelectTrigger className="w-full bg-white h-11">
                            <SelectValue placeholder="Search or select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allCustomers.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-slate-400 text-xs ml-1">({c.phone})</span></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {/* Add New Customer Link */}
                    <div className="flex justify-end">
                        <Button asChild variant="link" className="text-indigo-600 h-auto p-0 text-xs">
                            <Link href="/customers/new">
                                <PlusCircle className="h-3 w-3 mr-1" /> Add New Customer
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Transaction Type Tabs */}
            <Tabs defaultValue="credit" value={paymentType} onValueChange={(v: any) => setPaymentType(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-200 p-1 rounded-xl h-12">
                    <TabsTrigger value="credit" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all">
                        Udhaar
                    </TabsTrigger>
                    <TabsTrigger value="cash" className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">
                        Cash Sale
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                        Payment In
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* A. ITEM LIST (For Credit/Cash) */}
                    {(paymentType === 'credit' || paymentType === 'cash') && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-slate-700">Items List</CardTitle>
                                    <CardDescription className="text-xs">Add products sold</CardDescription>
                                </div>
                                <Button onClick={addItem} size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100">
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="relative bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                                        <div className="grid gap-3">
                                            {/* Name */}
                                            <div className="col-span-3">
                                                <Label className="text-xs text-slate-500 mb-1 block">Item Name</Label>
                                                <Input 
                                                    value={item.name} 
                                                    onChange={e => updateItem(item.id, 'name', e.target.value)} 
                                                    placeholder="e.g. Rice, Sugar"
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            {/* Qty & Price */}
                                            <div className="grid grid-cols-3 gap-2 items-end">
                                                <div>
                                                    <Label className="text-xs text-slate-500 mb-1 block">Qty</Label>
                                                    <Input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                                                        className="h-9 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-500 mb-1 block">Rate</Label>
                                                    <Input 
                                                        type="number" 
                                                        value={item.price} 
                                                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} 
                                                        className="h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="text-right pb-2">
                                                    <span className="text-sm font-bold text-slate-800">₹{item.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* B. PAYMENT AMOUNT (For Payment Received) */}
                    {paymentType === 'payment' && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label className="mb-2 block text-slate-600">Amount Received</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        type="number" 
                                        value={paymentAmount} 
                                        onChange={e => setPaymentAmount(e.target.value)} 
                                        placeholder="0" 
                                        className="pl-10 h-12 text-lg font-semibold"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Yeh amount customer ke udhaar se minus ho jayega.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </Tabs>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-center">
                    <span className="mr-2">⚠️</span> {error}
                </div>
            )}

        </main>

        {/* --- BOTTOM STICKY BAR (Total & Save) --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                
                {/* Total Display */}
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                        {paymentType === 'payment' ? 'Amount Received' : 'Grand Total'}
                    </p>
                    <p className={`text-2xl font-bold flex items-center ${
                        paymentType === 'credit' ? 'text-red-600' : 
                        paymentType === 'cash' ? 'text-green-600' : 'text-indigo-600'
                    }`}>
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {paymentType === 'payment' ? (parseFloat(paymentAmount) || 0).toLocaleString() : grandTotal.toLocaleString()}
                    </p>
                </div>

                {/* Save Button */}
                <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className={`h-12 px-8 rounded-full text-base font-semibold shadow-lg transition-transform active:scale-95 ${
                        paymentType === 'credit' ? 'bg-red-600 hover:bg-red-700' :
                        paymentType === 'cash' ? 'bg-green-600 hover:bg-green-700' :
                        'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Save
                </Button>
            </div>
        </div>

      </div>
    </AuthGuard>
  );
};

export default NewTransactionPage;