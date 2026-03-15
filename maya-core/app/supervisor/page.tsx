import { SupervisorScreen } from '@/components/supervisor-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';

export default async function SupervisorPage() {
  await requireMayaPageAuth('/supervisor');

  return <SupervisorScreen />;
}
