'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
// ⭐ FIX: IndianRupee icon added here ⭐
import { ArrowLeft, Save, Package, Hash, Calendar, Trash2, RefreshCw, IndianRupee } from 'lucide-react'; 
import Link from 'next/link';
import { secureApiCall } from '@/lib/api'; 
import { useAuth } from '@/lib/authContext'; 

// ⭐ SHADCN IMPORTS ⭐
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryFormProps {
    isNew: boolean;
}

// Define the type for item data
interface InventoryItem {
    id?: string;
    name: string;
    quantity: number;
    expiryDate: string | null;
    unitCost: number;
    sellingPrice: number;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ isNew }) => {
    const params = useParams();
    const router = useRouter();
    const itemId = params.itemId as string | undefined;
    const { loading: authLoading } = useAuth();

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [expiryDate, setExpiryDate] = useState('');
    const [unitCost, setUnitCost] = useState(0);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(!isNew); 
    const [isDeleting, setIsDeleting] = useState(false);

    // Effect to Load Data if it's an Edit Form
    useEffect(() => {
        if (authLoading) return; // Wait for auth

        if (!isNew && itemId) {
            const loadData = async () => {
                setFormLoading(true);
                setError(null);
                try {
                    // ⭐ GET Single Item API Call ⭐
                    const itemData: InventoryItem = await secureApiCall(`/inventory/${itemId}`, 'GET');
                    
                    setName(itemData.name || '');
                    setQuantity(itemData.quantity || 0);
                    // Format date string for input field
                    setExpiryDate(itemData.expiryDate ? itemData.expiryDate.split('T')[0] : ''); 
                    setUnitCost(itemData.unitCost || 0);
                    setSellingPrice(itemData.sellingPrice || 0);

                } catch (e: any) {
                    console.error('Failed to load item:', e);
                    setError(e.message || 'Item not found or loading failed.');
                }
                setFormLoading(false);
            };
            loadData();
        }
    }, [isNew, itemId, router, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || quantity <= 0 || sellingPrice <= 0) {
            setError("Name, Quantity, and Selling Price must be valid.");
            return;
        }

        setIsLoading(true);

        const itemData = {
            name,
            quantity: parseInt(quantity.toString()),
            expiryDate: expiryDate || null,
            unitCost: parseFloat(unitCost.toString()),
            sellingPrice: parseFloat(sellingPrice.toString()),
        };

        try {
            if (isNew) {
                // ⭐ POST (Create) API Call ⭐
                await secureApiCall('/inventory', 'POST', itemData);
                alert(`Item ${name} added successfully!`);
            } else {
                // ⭐ PUT (Update) API Call ⭐
                await secureApiCall(`/inventory/${itemId}`, 'PUT', itemData);
                alert(`Item ${name} updated successfully!`);
            }
            
            router.push('/inventory'); // Go back to list

        } catch (err: any) {
            console.error("Save Error:", err);
            setError(`Item ${isNew ? 'jodne' : 'update karne'} mein error aayi: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteItem = async () => {
        if (!confirm(`Are you sure you want to delete item ${name}? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            // ⭐ DELETE API Call ⭐
            await secureApiCall(`/inventory/${itemId}`, 'DELETE');
            
            alert(`${name} successfully deleted.`);
            router.push('/inventory'); 

        } catch (err: any) {
             console.error("Failed to delete item:", err);
             setError("Item delete nahi ho paya.");
        } finally {
            setIsDeleting(false);
        }
    };
    
    const profitMargin = (sellingPrice - unitCost) * quantity;

    if (formLoading || authLoading) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-600" />
                 <p className="text-slate-600">Loading Item Data...</p>
             </div>
         );
    }
    if (error && !isNew) {
         return (
             <div className="min-h-screen bg-slate-50 p-4 flex flex-col justify-center items-center">
                <Card className="max-w-md w-full p-6 text-center shadow-md">
                    <CardTitle className='text-red-600 text-lg'>Error Loading Item</CardTitle>
                    <CardDescription className='mt-2 text-red-700'>{error}</CardDescription>
                    <Link href="/inventory" className="mt-4 inline-block">
                        <Button variant="outline" className='text-indigo-600'>Go to Inventory List</Button>
                    </Link>
                </Card>
             </div>
         );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            
            {/* Header Section (Matching Detail Page Header) */}
            <header className="sticky top-0 z-20 bg-white shadow-sm p-4 flex items-center border-b border-slate-200">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-600">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-slate-800 ml-4">
                    {isNew ? 'Add New Stock Item' : 'Edit Stock Item'}
                </h1>
            </header>

            {/* Form Section */}
            <main className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className='text-lg'>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* Item Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">Item Name *</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Aashirvaad Atta, Amul Butter, etc."
                                        className="pl-10 bg-white focus-visible:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-1">
                                <Label htmlFor="quantity">Current Stock Quantity *</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        id="quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                        min="0"
                                        className="pl-10 bg-white focus-visible:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div className="space-y-1">
                                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        id="expiryDate"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="pl-10 bg-white focus-visible:ring-indigo-500"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Yeh date bharenge toh **Expiry Alerts** milenge.
                                </p>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Pricing Card */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className='text-lg'>Pricing & Profit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                 {/* Unit Cost */}
                                <div className="space-y-1">
                                    <Label htmlFor="unitCost">Purchase Cost (Per Unit)</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            id="unitCost"
                                            value={unitCost}
                                            onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            className="pl-10 bg-white focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                 {/* Selling Price */}
                                <div className="space-y-1">
                                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            id="sellingPrice"
                                            value={sellingPrice}
                                            onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            className="pl-10 bg-white focus-visible:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profit Display */}
                            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex justify-between text-sm font-medium">
                                <span className="text-indigo-700">Estimated Total Profit:</span>
                                <span className="text-indigo-800 font-bold">
                                    ₹{profitMargin.toLocaleString('en-IN')}
                                </span>
                            </div>

                        </CardContent>
                    </Card>


                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-base"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {isLoading ? 'Saving Stock...' : (isNew ? 'Save New Item' : 'Update Item')}
                    </Button>
                    
                    {/* Delete button only for existing items */}
                    {!isNew && (
                         <Button
                            type="button"
                            onClick={handleDeleteItem}
                            disabled={isDeleting}
                            variant="destructive"
                            className={`w-full h-10 text-base font-semibold transition duration-200 mt-2`}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete Item'}
                        </Button>
                    )}
                </form>
            </main>
        </div>
    );
};

export default InventoryForm;