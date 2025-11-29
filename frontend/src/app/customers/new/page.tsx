'use client';

import AuthGuard from '@/lib/AuthGuard';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Save, User, Phone, IndianRupee, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { secureApiCall } from '@/lib/api';

// ⭐ SHADCN IMPORTS
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const NewCustomerPage = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [initialDue, setInitialDue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim() || !phone.trim()) {
            setError("Naam aur Mobile Number bharna zaruri hai.");
            return;
        }

        if (phone.length < 10) {
            setError("Mobile number kam se kam 10 digits ka hona chahiye.");
            return;
        }

        setIsLoading(true);

        const customerData = {
            name,
            phone,
            initialDue: parseFloat(initialDue || '0'), 
        };

        try {
            await secureApiCall('/customers', 'POST', customerData);
            router.push('/customers'); // Redirect back to list
        } catch (err: any) {
            console.error("Failed to add customer:", err);
            setError(err.message || "Customer save nahi ho paya. Dobara koshish karein.");
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 pb-12">
                
                {/* ================= HEADER ================= */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-indigo-600">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-lg font-bold text-slate-800">New Customer</h1>
                    </div>
                </header>

                {/* ================= FORM CONTENT ================= */}
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-slate-900">Add Customer Details</CardTitle>
                            <CardDescription>Naye customer ki details neeche bharein.</CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* ERROR ALERT */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        {error}
                                    </div>
                                )}

                                {/* 1. NAME FIELD */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-700">Customer Name <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Rahul Kirana"
                                            className="pl-10 h-11 text-base bg-slate-50/50 focus:bg-white"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* 2. PHONE FIELD */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-slate-700">Mobile Number <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <div className="absolute left-10 top-[11px] text-slate-400 text-sm border-r border-slate-300 pr-2">+91</div>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                // Only allow numbers
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 10) setPhone(val);
                                            }}
                                            placeholder="98765 43210"
                                            className="pl-24 h-11 text-base bg-slate-50/50 focus:bg-white tracking-wide"
                                        />
                                    </div>
                                </div>

                                {/* 3. INITIAL DUES FIELD */}
                                <div className="space-y-2">
                                    <Label htmlFor="initialDue" className="text-slate-700">Purana Udhaar (Optional)</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 h-5 w-5 flex items-center justify-center">
                                            <IndianRupee className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <Input
                                            id="initialDue"
                                            type="number"
                                            value={initialDue}
                                            onChange={(e) => setInitialDue(e.target.value)}
                                            placeholder="0"
                                            className="pl-10 h-11 text-base bg-slate-50/50 focus:bg-white"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Agar is customer par pehle se kuch paise baaki hain toh yahan likhein.
                                    </p>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 shadow-md mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-5 w-5" /> Save Customer
                                        </>
                                    )}
                                </Button>

                            </form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </AuthGuard>
    );
};

export default NewCustomerPage;