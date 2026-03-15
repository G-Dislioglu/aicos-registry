import { ContextScreen } from '@/components/context-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';

export default async function ContextPage() {
  await requireMayaPageAuth('/context');

  return <ContextScreen />;
}
