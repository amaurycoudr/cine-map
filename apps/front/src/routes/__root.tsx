import { queryClient } from '@/client';
import { ModeToggle } from '@/components/smart-ui/mode-toggle';
import { ThemeProvider } from '@/hooks/useTheme';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ModeToggle />
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools client={queryClient} buttonPosition="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  ),
});
