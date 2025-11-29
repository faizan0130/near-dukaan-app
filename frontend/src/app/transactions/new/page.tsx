'use client';

import AuthGuard from '@/lib/AuthGuard';
import { useRouter, useSearchParams } from 'next/navigation';
// ⭐ FIX 1: Explicitly import React and Suspense ⭐
import React, { useState, useEffect, useCallback, Suspense } from 'react'; 
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
    // searchParams is accessed here, necessitating the wrapper below
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const { loading: authLoading } = useAuth(); 

    // States for Customer Data 
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [customerLoading, setCustomerLoading] = useState(true);

    const initialCustomerId = searchParams.get('customerId') || '';
    
    // States for Form Data
    const [customerId, setCustomerId] = useState(initialCustomerId);
    const [customerName, setCustomerName] = useState('Select Customer');
    const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'payment'>('credit');
    const [items, setItems] = useState<Item[]>([{ id: 1, name: '', quantity: 1, price: 0, total: 0 }]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(0); 

    
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
                    setCustomerName(customer.name);
                }
            } else if (data.length > 0 && !customerId) {
                setCustomerId(data[0].id);
                setCustomerName(data[0].name);
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

    // --- Item List Management (Logic remains the same) ---

    const updateItem = useCallback((id: number, field: keyof Item, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'price') {
                    updatedItem.total = updatedItem.quantity * updatedItem.price;
                }
                return updatedItem;
            }
            return item;
        }));
    }, []);

    const addItem = () => {
        const newId = items.length ? items[items.length - 1].id + 1 : 1;
        setItems(prevItems => [...prevItems, { id: newId, name: '', quantity: 1, price: 0, total: 0 }]);
    };

    const removeItem = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    // --- Form Submission (API Integration) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!customerId) {
            setError("Please select a customer first.");
            return;
        }
        
        let finalAmount = paymentType === 'payment' ? paymentAmount : grandTotal;
        if (finalAmount <= 0) {
            setError(`Total amount or Payment amount must be greater than zero.`);
            return;
        }

        setIsLoading(true);

        const transactionData = {
            customerId,
            totalAmount: finalAmount,
            paymentType,
            items: paymentType !== 'payment' ? items.filter(item => item.name && item.total > 0) : [],
            notes: (paymentType === 'payment' ? 'Payment received' : 'Items purchased'), 
        };

        try {
            await secureApiCall('/transactions', 'POST', transactionData); 
            
            alert(`${paymentType.toUpperCase()} Transaction saved! Total: ₹${finalAmount.toLocaleString('en-IN')}.`);

            router.push(`/customers/${customerId}`);

        } catch (err: any) {
            console.error("Transaction Error:", err);
            setError(err.message || "Transaction save nahi ho paya. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Customer Dropdown/Selector Handler for Shadcn Select
    const handleSelectChange = (id: string) => {
        const customer = allCustomers.find(c => c.id === id);
        if (customer) {
            setCustomerId(id);
            setCustomerName(customer.name);
        }
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
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
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className='pb-3'>
                                <CardTitle className="text-lg">Transaction Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setPaymentType('credit')}
                                        variant={paymentType === 'credit' ? 'default' : 'secondary'}
                                        className={paymentType === 'credit' ? 'bg-red-500 hover:bg-red-600' : 'text-slate-600'}
                                    >
                                        Udhaar (Credit)
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setPaymentType('cash')}
                                        variant={paymentType === 'cash' ? 'default' : 'secondary'}
                                        className={paymentType === 'cash' ? 'bg-green-500 hover:bg-green-600' : 'text-slate-600'}
                                    >
                                        Naqad (Cash)
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setPaymentType('payment')}
                                        variant={paymentType === 'payment' ? 'default' : 'secondary'}
                                        className={paymentType === 'payment' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-slate-600'}
                                    >
                                        Payment Received
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>


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
                                            <div key={item.id} className="border border-slate-200 p-3 rounded-lg bg-slate-50">
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
                                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
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
                        <Card className="shadow-xl border-t-4 border-indigo-600 sticky bottom-0 z-10">
                            <CardContent className='p-4 space-y-3'>
                                {paymentType !== 'payment' && (
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-semibold text-slate-800">Grand Total</p>
                                        <p className="text-2xl font-extrabold text-indigo-600 flex items-center">
                                            <IndianRupee className="h-5 w-5 mr-1" />
                                            {grandTotal.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || allCustomers.length === 0 || (paymentType !== 'payment' && grandTotal <= 0)}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-base"
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    {isLoading ? 'Saving Transaction...' : 'Record Transaction'}
                                </Button>
                            </CardContent>
                        </Card>
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