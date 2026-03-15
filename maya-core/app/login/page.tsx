import type { Route } from 'next';

import { LoginScreen } from '@/components/login-screen';

type LoginPageProps = {
  searchParams?: {
    mode?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const requestedNext = searchParams?.next || '/';
  const nextPath = (requestedNext.startsWith('/') ? requestedNext : '/') as Route;

  return <LoginScreen mode={searchParams?.mode} nextPath={nextPath} />;
}
