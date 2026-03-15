import { MayaChatScreen } from '@/components/maya-chat-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';

export default async function MayaPage() {
  await requireMayaPageAuth('/maya');

  return <MayaChatScreen />;
}
