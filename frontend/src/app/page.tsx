'use client';

import Link from 'next/link';
import Image from 'next/image'; // <-- Imported Image
import { ShoppingBag, Users, Clock, Zap, ArrowRight, Star, Smartphone } from 'lucide-react'; // Smartphone removed, ArrowRight added
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ⭐ SHADCN IMPORTS
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// --- COMPONENTS ---

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    <CardHeader className="pb-2">
      <div className="mb-4 inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-slate-600 text-base leading-relaxed">{description}</CardDescription>
    </CardContent>
  </Card>
);

const TestimonialCard = ({ name, role, quote, initial }: { name: string, role: string, quote: string, initial: string }) => (
  <Card className="bg-slate-50 border-slate-100 shadow-sm">
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{initial}</AvatarFallback>
      </Avatar>
      <div>
        <CardTitle className="text-base font-semibold text-slate-800">{name}</CardTitle>
        <CardDescription className="text-xs">{role}</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex text-yellow-400 mb-2">
        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
      </div>
      <p className="text-slate-700 italic">"{quote}"</p>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-600 font-medium animate-pulse">Loading Near Dukaan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100">
      
      {/* 1. Header/Navigation (Glassmorphism) */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              Near Dukaan
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Login
            </Link>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-full px-6">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* 2. Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-50 rounded-[100%] blur-3xl -z-10 opacity-60" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 border-indigo-100">
              🚀 1000+ Dukaandar iska bharosa karte hain
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Aapki Dukaan, <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Ab Aur Bhi Smart.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Udhaar manage karein, expiry alerts paayein aur inventory sambhalein — sab kuch apne mobile se. 
              <strong> Kagaz-pen ko karein bye-bye! 👋</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="w-full sm:w-auto px-8 h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                <Link href="/signup">
                  Muft Mein Shuru Karein <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 h-12 text-lg border-slate-300 hover:bg-slate-50 text-slate-700">
                <Link href="/login">Purane User Login</Link>
              </Button>
            </div>

            {/* ⭐ MOCKUP IMAGE INTEGRATION (FIXED HERE) ⭐ */}
            <div className="mt-16 relative mx-auto max-w-4xl">
               <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-indigo-300/40 overflow-hidden">
                    {/* Assuming the image is named dashboard_mockup.png and placed in /public */}
                    <Image
                        src="/dashboard_mockup.png" 
                        alt="Near Dukaan Dashboard Mobile and Desktop Mockup"
                        width={1024} 
                        height={576} 
                        priority 
                        className="w-full h-auto"
                    />
                </div>
            </div>
            {/* ⭐ END MOCKUP IMAGE INTEGRATION ⭐ */}

          </div>
        </section>

        {/* 3. Stats Section */}
        <section className="py-10 bg-slate-900 text-white">
             <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-400">₹10 Lakh+</p>
                <p className="text-sm text-slate-300 mt-1">Udhaar Tracked</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-400">500+</p>
                <p className="text-sm text-slate-300 mt-1">Active Shops</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-400">Zero</p>
                <p className="text-sm text-slate-300 mt-1">Data Loss</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-400">24/7</p>
                <p className="text-sm text-slate-300 mt-1">Support</p>
              </div>
            </div>
        </section>

        {/* 4. Features Section */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Kyun chunein Near Dukaan?
              </p>
              <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
                Wo sab kuch jo ek smart dukaan ko chahiye.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={Users}
                title="Customer Hisab-Kitab"
                description="Har customer ka udhaar digital rakhein. WhatsApp par reminder bhejein aur payment collect karein."
              />
              <FeatureCard
                icon={Clock}
                title="Expiry Alerts"
                description="Samaan expire hone se pehle notification paayein taaki nuksaan se bacha ja sake."
              />
              <FeatureCard
                icon={Zap}
                title="Instant Billing"
                description="Tezi se bill banayein aur customer ko bhejein. Calculator ki ab zarurat nahi."
              />
              <FeatureCard
                icon={ShoppingBag}
                title="Inventory Management"
                description="Kaunsa samaan khatam ho raha hai, turant pata karein aur order lagayein."
              />
            </div>
          </div>
        </section>

        {/* 5. Testimonials (Social Proof) */}
        <section className="py-24 bg-white">
             <div className="max-w-6xl mx-auto px-4">
                 <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Dukaandaar bhaiyon ki rai</h2>
                 <div className="grid md:grid-cols-3 gap-6">
                     <TestimonialCard 
                         name="Ramesh Gupta" 
                         role="Kirana Store Owner, Delhi"
                         initial="R"
                         quote="Pehle udhaar ki copy kho jaati thi, ab sab kuch mobile mein hai. Payment collection 2x tez ho gaya hai!"
                     />
                     <TestimonialCard 
                         name="Abdul Khan" 
                         role="Bakery Shop, Mumbai"
                         initial="A"
                         quote="Expiry alerts ne mera bohot paisa bachaya hai. Ab bread aur milk kharab nahi hote."
                     />
                     <TestimonialCard 
                         name="Suresh Patel" 
                         role="General Store, Surat"
                         initial="S"
                         quote="Use karna bohot aasaan hai. Meri dukaan ka ladka bhi ise araam se chala leta hai."
                     />
                 </div>
             </div>
        </section>

        {/* 6. FAQ Section (Accordion) */}
        <section className="py-20 bg-indigo-50/50">
             <div className="max-w-3xl mx-auto px-4">
                 <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">Aksar Puche Jaane Wale Sawal (FAQs)</h2>
                 
                 <Accordion type="single" collapsible className="w-full bg-white p-6 rounded-2xl shadow-sm">
                     <AccordionItem value="item-1">
                         <AccordionTrigger className="text-lg font-medium text-slate-800">Kya ye app free hai?</AccordionTrigger>
                         <AccordionContent className="text-slate-600">
                         Ji haan! Near Dukaan ka basic version bilkul muft hai. Aap ise aaj hi download karke use kar sakte hain.
                         </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="item-2">
                         <AccordionTrigger className="text-lg font-medium text-slate-800">Kya mera data safe hai?</AccordionTrigger>
                         <AccordionContent className="text-slate-600">
                         Bilkul. Aapka data 100% secure aur encrypted hai. Agar phone kho bhi jaye, toh naye phone mein login karke sab wapas mil jayega.
                         </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="item-3">
                         <AccordionTrigger className="text-lg font-medium text-slate-800">Kya ise chalane ke liye computer chahiye?</AccordionTrigger>
                         <AccordionContent className="text-slate-600">
                         Nahi! Ye "Mobile-First" solution hai. Aap ise kisi bhi saste Android smartphone par chala sakte hain.
                         </AccordionContent>
                     </AccordionItem>
                 </Accordion>
             </div>
        </section>

        {/* 7. Bottom CTA */}
        <section className="py-20 bg-indigo-600">
             <div className="max-w-4xl mx-auto px-4 text-center text-white">
                 <h2 className="text-3xl md:text-4xl font-bold mb-6">Apni Dukaan ko Digital Banane ke liye Taiyaar?</h2>
                 <p className="text-indigo-100 text-lg mb-8">Aaj hi hazaro shopkeepers ke community mein shamil ho.</p>
                 <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 font-bold text-lg px-10 h-14 rounded-full shadow-2xl">
                     <Link href="/signup">Abhi Download Karein</Link>
                 </Button>
                 <p className="mt-4 text-sm text-indigo-200">No credit card required • Free plan available</p>
             </div>
        </section>

      </main>

      {/* 8. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
             <div className="col-span-1 md:col-span-2">
                 <div className="flex items-center space-x-2 text-white mb-4">
                     <ShoppingBag className="h-6 w-6" />
                     <span className="text-xl font-bold">Near Dukaan</span>
                 </div>
                 <p className="text-sm max-w-xs leading-relaxed">Local businesses ko technology ke madhyam se aage badhana hamara mission hai.</p>
             </div>
             <div>
                 <h3 className="text-white font-semibold mb-4">Product</h3>
                 <ul className="space-y-2 text-sm">
                     <li><Link href="#" className="hover:text-indigo-400">Features</Link></li>
                     <li><Link href="#" className="hover:text-indigo-400">Pricing</Link></li>
                     <li><Link href="#" className="hover:text-indigo-400">Updates</Link></li>
                 </ul>
             </div>
             <div>
                 <h3 className="text-white font-semibold mb-4">Support</h3>
                 <ul className="space-y-2 text-sm">
                     <li><Link href="#" className="hover:text-indigo-400">Help Center</Link></li>
                     <li><Link href="#" className="hover:text-indigo-400">Contact Us</Link></li>
                     <li><Link href="#" className="hover:text-indigo-400">Privacy Policy</Link></li>
                 </ul>
             </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-sm">
           &copy; {new Date().getFullYear()} Near Dukaan Technologies Pvt Ltd. All rights reserved.
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;