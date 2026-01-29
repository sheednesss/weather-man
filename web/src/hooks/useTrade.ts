import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { predictionMarketAbi, USDC_DECIMALS } from '@/lib/contracts'

export function useBuy(marketAddress: `0x${string}`) {
  const queryClient = useQueryClient()
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buy = (isYes: boolean, amount: string) => {
    writeContract({
      address: marketAddress,
      abi: predictionMarketAbi,
      functionName: 'buy',
      args: [parseUnits(amount, USDC_DECIMALS), isYes],
    })
  }

  // Invalidate queries on success
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['markets'] })
    queryClient.invalidateQueries({ queryKey: ['positions'] })
    queryClient.invalidateQueries({ queryKey: ['markets-with-weather'] })
  }

  return { buy, isPending, isConfirming, isSuccess, error, hash, reset }
}

export function useSell(marketAddress: `0x${string}`) {
  const queryClient = useQueryClient()
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const sell = (isYes: boolean, amount: string) => {
    writeContract({
      address: marketAddress,
      abi: predictionMarketAbi,
      functionName: 'sell',
      args: [parseUnits(amount, USDC_DECIMALS), isYes],
    })
  }

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['markets'] })
    queryClient.invalidateQueries({ queryKey: ['positions'] })
    queryClient.invalidateQueries({ queryKey: ['markets-with-weather'] })
  }

  return { sell, isPending, isConfirming, isSuccess, error, hash, reset }
}
