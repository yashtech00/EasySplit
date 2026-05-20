import { useRouter } from 'expo-router';

export function useSafeRouter() {
  const router = useRouter();

  return {
    push: (href: any, options?: any) => router.push(href, options),
    replace: (href: any, options?: any) => router.replace(href, options),
    navigate: (href: any, options?: any) => router.navigate(href, options),
    canGoBack: () => router.canGoBack(),
    setParams: (params?: any) => router.setParams(params),
    back: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    },
  };
}
