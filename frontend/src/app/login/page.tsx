'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // ⭐ FIXED: Auth imported from firebase config
import { useAuth } from '@/lib/authContext';

// Icons
import { Mail, Lock, ArrowLeft, Loader2, ShoppingBag, AlertCircle } from 'lucide-react';

// ⭐ SHADCN IMPORTS ⭐
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card'; // We only use Card, not Header/Content/Footer specifically

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect logic
    useEffect(() => {
        if (user && !authLoading) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email || !password) {
            setError('Email aur password dono bharna zaruri hai.');
            setIsLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error("Login Error:", err.message);
            
            if (err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found') {
                setError('Ye email hamare record mein nahi hai. Kripya check karein.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') { // Added auth/invalid-credential for newer Firebase versions
                setError('Password galat hai. Dobara koshish karein.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Bohot baar galat password dala gaya hai. Kripya thodi der baad try karein.');
            } else {
                setError('Login fail ho gaya. Kripya internet check karein ya baad mein try karein.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Loading Screen to prevent flicker
    if (authLoading || user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
            
            {/* LEFT SIDE: Form Section */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="mx-auto grid w-[350px] gap-6">
                    
                    {/* Back Button */}
                    <Link 
                        href="/" 
                        className="group flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Wapas Home Jayein
                    </Link>

                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold text-slate-900">Welcome Back! 👋</h1>
                        <p className="text-balance text-slate-500">
                            Apni dukaan manage karne ke liye login karein.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="grid gap-4">
                        
                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Email Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="shop@example.com"
                                    required
                                    className="pl-10" // Padding left for icon
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/forgot-password" className="ml-auto inline-block text-sm underline text-indigo-600 hover:text-indigo-800">
                                    Password bhool gaye?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    required
                                    className="pl-10" // Padding left for icon
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Remember Me Checkbox (Visual only for now) */}
                        <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                            >
                                Mujhe yaad rakhein (Remember me)
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg mt-2" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                                </>
                            ) : (
                                'Login Karein'
                            )}
                        </Button>
                        
                        {/* Divider / Signup Link */}
                        <div className="mt-4 text-center text-sm">
                            Account nahi hai?{" "}
                            <Link href="/signup" className="underline font-semibold text-indigo-600 hover:text-indigo-800">
                                Muft mein banayein
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* RIGHT SIDE: Visuals / Testimonial (Hidden on Mobile) */}
            <div className="hidden bg-slate-900 lg:flex flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"></div>

                <div className="relative z-10 max-w-lg text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
                            <ShoppingBag className="h-16 w-16 text-indigo-400" />
                        </div>
                    </div>
                    
                    <blockquote className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed text-indigo-100">
                        &ldquo;Near Dukaan meri life ka sabse best tool hai. Hisab-kitab ab mere phone par rehta hai, aur dimaag tension-free rehta hai.&rdquo;
                        </p>
                        <footer className="pt-4 text-sm text-indigo-300">
                            <div className="font-semibold text-white">Rajesh Kumar</div>
                            <div>Owner, Laxmi General Store</div>
                        </footer>
                    </blockquote>
                </div>
            </div>

        </div>
    );
};

export default LoginPage;