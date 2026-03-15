import { ChatScreen } from '@/components/chat-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';

export default async function ChatPage() {
  await requireMayaPageAuth('/chat');

  return <ChatScreen />;
}
