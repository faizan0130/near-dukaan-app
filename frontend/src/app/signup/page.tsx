'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';

// Icons
import { Store, Mail, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

// ⭐ SHADCN IMPORTS
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SignupPage = () => {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic Validation
    if (!shopName || !email || !password) {
      setError('Kripya saare fields bharein.');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
        setError('Password kam se kam 6 characters ka hona chahiye.');
        setIsLoading(false);
        return;
    }

    if (!termsAccepted) {
        setError('Kripya Terms & Conditions ko accept karein.');
        setIsLoading(false);
        return;
    }

    try {
      // 1. Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Save shopkeeper profile details to Firestore
      // Hum Shop Name ko store kar rahe hain taaki dashboard par dikha sakein
      await setDoc(doc(db, "shopkeepers", newUser.uid), {
        shopName: shopName,
        email: newUser.email,
        createdAt: new Date(),
        onboardingComplete: false, // Useful for later specific setup steps
        plan: 'free'
      });

      // Redirect useEffect handle karega
    } catch (err: any) {
      console.error("Signup Error:", err.message);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Ye email pehle se registered hai. Login karein.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password bohot weak hai. Kuch strong rakhein.');
      } else {
        setError('Account banane mein dikkat aayi. Internet check karein.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading Screen
  if (authLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Setup ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      
      {/* LEFT SIDE: Signup Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto grid w-[400px] gap-6">
          
          <Link 
            href="/" 
            className="group flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Home Page
          </Link>

          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Nayi Dukaan Shuru Karein 🚀</h1>
            <p className="text-balance text-slate-500">
              Sirf 30 seconds mein apna digital account banayein.
            </p>
          </div>

          <form onSubmit={handleSignup} className="grid gap-4">
            
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Shop Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="shopName">Dukaan ka Naam</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="shopName"
                  type="text"
                  placeholder="Jaise: Gupta General Store"
                  className="pl-10"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email ID</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="shop@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Kam se kam 6 digits"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                 Tip: Mobile number ya naam mat rakhein.
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                >
                    Main <span className="text-indigo-600 underline cursor-pointer">Terms & Conditions</span> se sehmat hoon.
                </label>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg mt-2 h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setup ho raha hai...
                </>
              ) : (
                'Account Banayein'
              )}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              Pehle se account hai?{" "}
              <Link href="/login" className="underline font-semibold text-indigo-600 hover:text-indigo-800">
                Login Karein
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Visuals & Benefits (Hidden on Mobile) */}
      <div className="hidden bg-slate-900 lg:flex flex-col justify-center p-12 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Near Dukaan Premium <br /><span className="text-indigo-400">Join karne ke fayde:</span></h2>
            
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Digital Udhaar Khata</h3>
                        <p className="text-slate-400 text-sm">Purane register ko bhool jaiye. Ab hisab-kitab automatic aur safe rahega.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Free Updates Lifetime</h3>
                        <p className="text-slate-400 text-sm">Humare naye features jaise GST Bill aur Stock Alerts apko muft milenge.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                        <Store className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Smart Inventory</h3>
                        <p className="text-slate-400 text-sm">Apni dukaan ke samaan ki expiry aur quantity phone par track karein.</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 text-center">
                 <p className="text-slate-400 text-sm">Join <span className="text-white font-bold">1,000+</span> shopkeepers today.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;