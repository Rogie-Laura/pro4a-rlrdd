import { ModulePlaceholder } from '@/components/dashboard/module-placeholder';
import { CampsIcon } from '@/components/dashboard/nav-icons';
import { requireRlrddAccess } from '@/lib/auth/session';

export default async function CampsPage() {
  await requireRlrddAccess();

  return (
    <ModulePlaceholder
      title="Camps / Stations / Offices"
      description="Facilities, stations, camps, and office assets."
      icon={<CampsIcon className="h-7 w-7" />}
    />
  );
}
