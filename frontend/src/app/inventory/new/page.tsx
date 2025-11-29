// This file will handle the Add New Item route: /inventory/new

import InventoryForm from '@/components/InventoryForm';
import AuthGuard from '@/lib/AuthGuard';

const NewInventoryPage = () => {
  // Pass isNew prop to tell the form component it's a new item
  return (
    <AuthGuard>
      <InventoryForm isNew={true} />
    </AuthGuard>
  );
};

export default NewInventoryPage;