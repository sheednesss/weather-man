import { useEffect } from 'react';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
import { vaultAbi, erc20Abi, VAULT_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from '@/lib/contracts';

/**
 * Hook to read vault balance for an address
 */
export function useVaultBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VAULT_ADDRESS,
    },
  });
}

/**
 * Hook to approve USDC spending by the vault
 */
export function useUsdcApproval() {
  const queryClient = useQueryClient();
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['usdcAllowance'] });
    }
  }, [isSuccess, queryClient]);

  const approve = (amount: string) => {
    if (!VAULT_ADDRESS) throw new Error('Vault address not configured');
    if (!USDC_ADDRESS) throw new Error('USDC address not configured');
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [VAULT_ADDRESS, parseUnits(amount, USDC_DECIMALS)],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, error, hash, reset };
}

/**
 * Hook to deposit USDC into the vault
 */
export function useVaultDeposit() {
  const queryClient = useQueryClient();
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['vaultBalance'] });
      queryClient.invalidateQueries({ queryKey: ['usdcBalance'] });
    }
  }, [isSuccess, queryClient]);

  const deposit = (amount: string) => {
    if (!VAULT_ADDRESS) throw new Error('Vault address not configured');
    writeContract({
      address: VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: 'deposit',
      args: [parseUnits(amount, USDC_DECIMALS)],
    });
  };

  return { deposit, isPending, isConfirming, isSuccess, error, hash, reset };
}

/**
 * Hook to withdraw USDC from the vault
 */
export function useVaultWithdraw() {
  const queryClient = useQueryClient();
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['vaultBalance'] });
      queryClient.invalidateQueries({ queryKey: ['usdcBalance'] });
    }
  }, [isSuccess, queryClient]);

  const withdraw = (amount: string) => {
    if (!VAULT_ADDRESS) throw new Error('Vault address not configured');
    writeContract({
      address: VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: 'withdraw',
      args: [parseUnits(amount, USDC_DECIMALS)],
    });
  };

  return { withdraw, isPending, isConfirming, isSuccess, error, hash, reset };
}

/**
 * Hook to read USDC allowance for the vault
 */
export function useUsdcAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && VAULT_ADDRESS ? [owner, VAULT_ADDRESS] : undefined,
    query: {
      enabled: !!owner && !!USDC_ADDRESS && !!VAULT_ADDRESS,
    },
  });
}

/**
 * Hook to read USDC balance
 */
export function useUsdcBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESS,
    },
  });
}

/**
 * Helper to format vault balance for display
 */
export function formatVaultBalance(balance: bigint | undefined): string {
  if (balance === undefined) return '0.00';
  return formatUnits(balance, USDC_DECIMALS);
}

/**
 * Helper to parse USDC amount from string
 */
export function parseUsdcAmount(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}
