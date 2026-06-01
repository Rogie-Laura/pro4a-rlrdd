import { ModulePlaceholder } from '@/components/dashboard/module-placeholder';
import { FirearmsIcon } from '@/components/dashboard/nav-icons';
import { requireRlrddAccess } from '@/lib/auth/session';

export default async function FirearmsPage() {
  await requireRlrddAccess();

  return (
    <ModulePlaceholder
      title="Firearms"
      description="Issued firearms, accountability, and status tracking."
      icon={<FirearmsIcon className="h-7 w-7" />}
    />
  );
}
