import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';

export function SignInButton() {
  const { isConnected } = useAccount();
  const { isAuthenticated, address, signIn, signOut, isSigningIn, isSigningOut } = useAuth();

  // Don't show anything if wallet not connected
  if (!isConnected) {
    return null;
  }

  // Show Sign Out button if authenticated
  if (isAuthenticated && address) {
    return (
      <button
        onClick={() => signOut()}
        disabled={isSigningOut}
        className="px-3 py-1.5 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
      >
        {isSigningOut ? 'Signing out...' : `${address.slice(0, 6)}...${address.slice(-4)}`}
      </button>
    );
  }

  // Show Sign In button if not authenticated
  return (
    <button
      onClick={() => signIn()}
      disabled={isSigningIn}
      className="px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
    >
      {isSigningIn ? 'Signing...' : 'Sign In'}
    </button>
  );
}
