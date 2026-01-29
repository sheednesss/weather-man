import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SessionResponse {
  address: string | null;
}

interface NonceResponse {
  nonce: string;
}

interface VerifyResponse {
  address: string;
}

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  // Query to get current session
  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async (): Promise<SessionResponse> => {
      return api<SessionResponse>('/auth/session');
    },
    staleTime: 30_000, // 30 seconds
    retry: false, // Don't retry auth failures
  });

  const isAuthenticated = Boolean(sessionQuery.data?.address);

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!address) throw new Error('Wallet not connected');

      // Step 1: Get nonce from server
      const { nonce } = await api<NonceResponse>('/auth/nonce');

      // Step 2: Create SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Weather Man',
        uri: window.location.origin,
        version: '1',
        chainId: 84532, // Base Sepolia
        nonce,
      });

      // Step 3: Get message string
      const message = siweMessage.prepareMessage();

      // Step 4: Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Step 5: Verify with server
      await api<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature }),
      });
    },
    onSuccess: () => {
      // Invalidate session query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api('/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      // Invalidate session query to clear auth state
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  return {
    isConnected,
    isAuthenticated,
    address: sessionQuery.data?.address ?? null,
    signIn: signInMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    error: signInMutation.error || signOutMutation.error || null,
  };
}
