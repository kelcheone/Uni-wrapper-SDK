import { Uni_Query, Uni_TokenAmount, Input_fetchTokenTotalSupply } from "./w3";

export function fetchTokenTotalSupply(
  input: Input_fetchTokenTotalSupply
): Uni_TokenAmount {
  const token = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.address,
    symbol: input.symbol,
    name: input.name,
  });

  const amount = Uni_Query.fetchTotalSupply({
    token: token,
  });

  return amount;
}
