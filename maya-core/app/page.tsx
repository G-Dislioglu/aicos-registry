import { HomeScreen } from '@/components/home-screen';
import { requireMayaPageAuth } from '@/lib/maya-auth';

export default async function HomePage() {
  await requireMayaPageAuth('/');

  return <HomeScreen />;
}
