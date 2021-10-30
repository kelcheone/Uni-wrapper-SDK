import {
  Uni_Query,
  Uni_Mutation,
  Input_simpleSwap,
  SwapOutput,
  Uni_TradeType,
} from "./w3";

export function simpleSwap(input: Input_simpleSwap): SwapOutput {
  const tokenIn = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.tokenInAddress,
    symbol: null,
    name: null,
  });

  const tokenOut = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.tokenOutAddress,
    symbol: null,
    name: null,
  });

  const txResponse = Uni_Mutation.swap({
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    amount: input.tokenInAmount,
    tradeType: Uni_TradeType.EXACT_INPUT,
    tradeOptions: input.tradeOptions,
    txOverrides: null,
  });

  return {
    txHash: txResponse.hash,
  };
}
