import { ModulePlaceholder } from '@/components/dashboard/module-placeholder';
import { AssetsIcon } from '@/components/dashboard/nav-icons';
import { requireRlrddAccess } from '@/lib/auth/session';

export default async function AssetsPage() {
  await requireRlrddAccess();

  return (
    <ModulePlaceholder
      title="Other PRO4A Assets"
      description="Equipment, IT assets, and other non-mobility property."
      icon={<AssetsIcon className="h-7 w-7" />}
    />
  );
}
