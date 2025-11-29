'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react'; 
import AuthGuard from '@/lib/AuthGuard';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, IndianRupee, RefreshCw, UserCheck, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { secureApiCall } from '@/lib/api';
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS ⭐
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';


// Define the type for customer data received from the API (for selection)
interface Customer {
    id: string;
    name: string;
    phone: string;
}

// Define the shape of a single item in the purchase list
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

    const initialCustomerId = searchParams.get('customerId') || '';
    
    // Form States
    const [customerId, setCustomerId] = useState(initialCustomerId);
    const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'payment'>('credit');
    const [items, setItems] = useState<Item[]>([{ id: 1, name: '', quantity: 1, price: 0, total: 0 }]);
    const [paymentAmount, setPaymentAmount] = useState<string>('0'); 
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    
    // --- Fetch Customer List for Selection (API Integration) ---
    const fetchCustomers = useCallback(async () => {
        if(authLoading) return;
        setCustomerLoading(true);
        try {
            const data: Customer[] = await secureApiCall('/customers', 'GET');
            setAllCustomers(data);
            
            const initialId = searchParams.get('customerId');
            if (initialId) {
                const customer = data.find(c => c.id === initialId);
                if (customer) {
                    setCustomerId(customer.id);
                }
            } else if (data.length > 0 && !customerId) {
                setCustomerId(data[0].id);
            }
        } catch (err: any) {
            console.error("Failed to fetch customer list:", err);
            setError("Customer list load nahi ho payi.");
        } finally {
            setCustomerLoading(false);
        }
    }, [authLoading, customerId, searchParams]);

    useEffect(() => {
        if (!authLoading) {
            fetchCustomers();
        }
    }, [authLoading, fetchCustomers]);


    // Calculate Grand Total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    // ⭐ FIX: Calculate finalAmount and validity in the Component Scope (using state values) ⭐
    // Note: We use state values directly for the calculation here
    const paymentValue = parseFloat(paymentAmount) || 0;
    const finalAmount = paymentType === 'payment' ? paymentValue : grandTotal;
    const isAmountValid = !isNaN(finalAmount) && finalAmount > 0;
    // -----------------------------------------------------------------------


    // --- Item List Management (Logic remains the same) ---

    const updateItem = useCallback((id: number, field: keyof Item, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'price') {
                    updated.total = (updated.quantity || 0) * (updated.price || 0);
                }
                return updated;
            }
            return item;
        }));
    }, []);

    const addItem = () => {
        const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems(prev => [...prev, { id: newId, name: '', quantity: 1, price: 0, total: 0 }]);
    };

    const removeItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // --- Submit (API Integration) ---
    const handleSubmit = async () => {
        setError(null);

        if (!customerId) {
            setError("Please select a customer first.");
            return;
        }
        
        // Validation uses the component-scope finalAmount
        if (!isAmountValid) {
            setError("Amount must be greater than zero.");
            return;
        }

        setIsLoading(true);

        const transactionData = {
            customerId,
            totalAmount: finalAmount, 
            paymentType,
            items: paymentType !== 'payment' ? items.filter(i => i.name) : [],
            notes: (paymentType === 'payment' ? 'Payment received' : 'Items purchased'), 
        };

        try {
            await secureApiCall('/transactions', 'POST', transactionData);
            alert(`${paymentType.toUpperCase()} Transaction saved! Total: ₹${finalAmount.toLocaleString('en-IN')}.`);
            router.push(`/customers/${customerId}`);
        } catch (err: any) {
            console.error("Txn Error:", err);
            setError(err.message || "Transaction save nahi ho paya. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Customer Dropdown/Selector Handler for Shadcn Select
    const handleSelectChange = (id: string) => {
        setCustomerId(id);
    };


    if (authLoading || customerLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading Customers...</p>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 pb-20">
                
                {/* Header Section (Matching Detail Page Header) */}
                <header className="sticky top-0 z-20 bg-white shadow-sm p-4 flex items-center border-b border-slate-200">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-600">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800 ml-4">Record New Entry</h1>
                </header>

                <main className="p-4 max-w-lg mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                        
                        {/* 1. Customer Selection */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className='pb-4'>
                                <CardTitle className="text-lg">Customer Information</CardTitle>
                                <CardDescription>Select the customer for this transaction.</CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="customerSelect" className='flex items-center gap-1 text-slate-700 font-medium'>
                                        <UserCheck className='h-4 w-4 text-slate-500' /> Customer Name
                                    </Label>
                                    <Select 
                                        value={customerId} 
                                        onValueChange={handleSelectChange} 
                                        disabled={allCustomers.length === 0}
                                    >
                                        <SelectTrigger id="customerSelect" className='bg-white'>
                                            <SelectValue placeholder={allCustomers.length > 0 ? "Select a customer" : "No customers available"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allCustomers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} ({c.phone})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button asChild variant="link" className='text-xs p-0 h-auto justify-start text-indigo-600 hover:text-indigo-700'>
                                    <Link href="/customers/new">
                                        <PlusCircle className='h-3 w-3 mr-1' /> Add New Customer
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 2. Transaction Type Toggle */}
                        <div className='w-full'>
                            <TabsList className="grid w-full grid-cols-3 bg-slate-200 p-1 rounded-xl h-12">
                                <TabsTrigger 
                                    value="credit" 
                                    onClick={() => setPaymentType('credit')}
                                    className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all"
                                    data-state={paymentType === 'credit' ? 'active' : 'inactive'}
                                >
                                    Udhaar
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="cash" 
                                    onClick={() => setPaymentType('cash')}
                                    className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                                    data-state={paymentType === 'cash' ? 'active' : 'inactive'}
                                >
                                    Cash Sale
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="payment" 
                                    onClick={() => setPaymentType('payment')}
                                    className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                                    data-state={paymentType === 'payment' ? 'active' : 'inactive'}
                                >
                                    Payment In
                                </TabsTrigger>
                            </TabsList>
                        </div>


                        {/* 3. Itemized List Input / Payment Amount Input */}
                        <Card className="shadow-sm border-slate-200">
                            {paymentType !== 'payment' ? (
                                <>
                                    <CardHeader className='flex flex-row justify-between items-center pb-3'>
                                        <CardTitle className="text-lg">Purchase Items</CardTitle>
                                        <Button 
                                            type="button" 
                                            onClick={addItem}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Item
                                        </Button>
                                    </CardHeader>
                                    <CardContent className='space-y-4 pt-0'>
                                        {items.map((item) => (
                                            <div key={item.id} className="relative border border-slate-200 p-3 rounded-lg bg-slate-50">
                                                {/* Item Name Input */}
                                                <div className="mb-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Item Name (e.g., Atta, Rice)"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                        className="w-full bg-white text-sm focus-visible:ring-indigo-500"
                                                        required
                                                    />
                                                </div>
                                                {/* Qty/Price Input */}
                                                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        min="1"
                                                        className="text-sm focus-visible:ring-indigo-500"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Price/Unit"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        className="text-sm focus-visible:ring-indigo-500"
                                                    />
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                                            ₹{item.total.toLocaleString('en-IN')}
                                                        </span>
                                                        {items.length > 1 && (
                                                            <Button type="button" onClick={() => removeItem(item.id)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 ml-1">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </>
                            ) : (
                                // Payment Received Input
                                <CardContent>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="paymentAmount" className='text-slate-700 font-medium'>Payment Amount</Label>
                                        <div className="relative">
                                            <IndianRupee className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                                            <Input
                                                type="number"
                                                id="paymentAmount"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="Enter amount received"
                                                min="1"
                                                className="w-full pl-10 focus-visible:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* 4. Grand Total Footer / Submit */}
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
                                        {isAmountValid ? finalAmount.toLocaleString('en-IN') : '0'}
                                    </p>
                                </div>

                                {/* Error/Submit Button */}
                                <div className='flex-1'>
                                    {error && (
                                        <p className="text-red-600 text-xs mb-2 text-right">{error}</p>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={isLoading || allCustomers.length === 0 || !isAmountValid}
                                        className={`w-full h-12 text-white shadow-lg text-base ${
                                            paymentType === 'credit' ? 'bg-red-600 hover:bg-red-700' : 
                                            paymentType === 'cash' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                    >
                                        <Save className="h-5 w-5 mr-2" />
                                        {isLoading ? 'Saving...' : 'Record Transaction'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </form>
                </main>
            </div>
        </AuthGuard>
    );
};

// ⭐ WRAPPER COMPONENT: Added Suspense Boundary for Vercel Build Fix ⭐
const NewTransactionWrapper = () => (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading transaction interface...</p>
        </div>
    }>
        <NewTransactionPage />
    </Suspense>
);

export default NewTransactionWrapper;