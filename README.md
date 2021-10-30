# Your Own Polywrapper (Using Uniswap)
> NOTE: If at any point during this tutorial you feel stuck, you can see the completed project [here](https://github.com/polywrap/uni-workshop/tree/completed). Additionally please feel free to reach out to us on [Discord](http://discord.polywrap.io/) if you have any questions, or need some hands on help.

## 0. Pre-Requisites
Have installed:
- Node.JS
- NVM (Node Version Manager)
- Yarn
- Docker
- Docker-Compose

Have a basic understanding of:
- GraphQL
- AssemblyScript
- Uniswap

## 1. Installation
From within this directory, run the following commands:
* `nvm install` - install the version of node listed in the `.nvmrc` file.
* `nvm use` - use the version of node listed in the `.nvmrc` file.
* `yarn` - install all package.json dependencies.

## 2. Write The Query Schema
In GraphQL & Polywrap, operations are seperated in Read & Write, or rather Query & Mutation. We'll start with first developing our Query module.

For each Polywrap module, there is a GraphQL schema & an Assemblyscript (or other wasm-compatible language) implementation. The GraphQL serves as the "public interface" for your webassembly code.

Navigate to the file:  
[`./src/query/schema.graphql`](./src/query/schema.graphql)

And add the following code:  
```graphql
#import { Query, ChainId, TokenAmount } into Uni from "w3://ens/v2.uniswap.web3api.eth"

type Query {
  fetchTokenTotalSupply(
    chainId: Uni_ChainId!
    address: String!
    symbol: String
    name: String
  ): Uni_TokenAmount!
}
```

In this schema, you'll see that first we import some types from the Uniswap polywrapper. Next, we define the `fetchTokenTotalSupply` query function.

## 3. Add the Query Implementation

Let's write the "implementation" of this function in AssemblyScript, which will later be compiled down to WebAssembly :)

In the file: 
[`./src/query/index.ts`](./src/query/index.ts)

Add the following code:  
```typescript
import {
  Uni_Query,
  Uni_TokenAmount,
  Input_fetchTokenTotalSupply
} from "./w3";

export function fetchTokenTotalSupply(input: Input_fetchTokenTotalSupply): Uni_TokenAmount {
  const token = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.address,
    symbol: input.symbol,
    name: input.name
  });

  const amount = Uni_Query.fetchTotalSupply({
    token: token
  });

  return amount;
}
```

In the code above, you can see that we're querying the Uniswap polywrapper from within our own custom wrapper. This shows just how easy it is to integrate and compose polywrappers together.

Additionally, you'll notice that we're importing the same types that are used in our GraphQL schema from the `./w3` folder. This is our "magic code-generation folder", where Polywrap's CLI generates "language bindings" for your interface's types. This generated code does all the a lot of heavy lifting for you, so all you have to worry about is implementing the business logic that makes your wrapper unique and useful.

## 4. Write The Mutation Schema

Next, we'll create a Mutation (write) function. This function will make it a bit easier for a user to swap tokens using Uniswap.

In the file:  
[`./src/mutation/schema.graphql`](./src/mutation/schema.graphql)

Add the following schema:  
```graphql
#import { Mutation, Query, ChainId, TokenAmount, TradeOptions } into Uni from "w3://ens/v2.uniswap.web3api.eth"

type Mutation {
  simpleSwap(
    chainId: Uni_ChainId!
    tokenInAddress: String!
    tokenOutAddress: String!
    tokenInAmount: BigInt!
    tradeOptions: Uni_TradeOptions!
  ): SwapOutput!
}

type SwapOutput {
  txHash: String!
}
```

As you can see, we define another function named `simpleSwap`, as well as a new custom type `SwapOutput`.

## 5. Add the Mutation Implementation

And finally, the mutation's implementation:  
[`./src/mutation/index.ts`](./src/mutation/index.ts)

```typescript
import {
  Uni_Query,
  Uni_Mutation,
  Input_simpleSwap,
  SwapOutput,
  Uni_TradeType
} from "./w3";

export function simpleSwap(input: Input_simpleSwap): SwapOutput {
  const tokenIn = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.tokenInAddress,
    symbol: null,
    name: null
  });

  const tokenOut = Uni_Query.fetchTokenData({
    chainId: input.chainId,
    address: input.tokenOutAddress,
    symbol: null,
    name: null
  });

  const txResponse = Uni_Mutation.swap({
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    amount: input.tokenInAmount,
    tradeType: Uni_TradeType.EXACT_INPUT,
    tradeOptions: input.tradeOptions,
    txOverrides: null
  });

  return {
    txHash: txResponse.hash
  }
}
```

## 6. Build Your Polywrapper

Now that our implementation is done, let's build this thing and see it running!

From within this directory, run the following commands:  
`yarn build`

This command may take a while the first time it's run. What it is doing (in the background) is asking the Polywrap CLI to build your polywrapper.

In order to make sure polywrappers can always be rebuilt on different machines, we use Docker. Docker allows us to create a "fresh build image" where your source files will be built into WebAssembly (Wasm) output files.

Docker helps you and your team better collaborate, and in the future will provide "source code verification" so users can see what your polywrapper's code looks like, helping increase trust in what they're running inside their apps.

After the build command finishes, you should see a `./build` folder. Take a peek inside! You'll find the fully-built GraphQL schema, Query & Mutation Wasm modules, and some web3api YAML manifest files. 

## 7. Test Your Polywrapper

Alright enough chit-chat, let's test it!

Luckily with Polywrap, testing is extremely easy to get up & running with. Since wrappers can be queried on-demand, we created a useful "query recipe" utility.

Checking the query recipe at:  
`./recipes/e2e.json`

This query recipe instructs the CLI to:  
1. Connect to the polywrapper @ `/ens/testnet/uni-integration.eth`
2. Execute the provided query

Let's try it. Run the following commands from within this folder:  
* `yarn test:env:up`
* `yarn deploy`
* `yarn test`

You should see the following output:
```
-----------------------------------
query {
  fetchTokenTotalSupply(
    chainId: $chainId
    address: $address
  )
}

{
  "chainId": "MAINNET",
  "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
}
-----------------------------------
-----------------------------------
{
  "fetchTokenTotalSupply": {
    "token": {
      "chainId": 0,
      "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "currency": {
        "decimals": 18,
        "symbol": "UNI",
        "name": "Uniswap"
      }
    },
    "amount": "1000000000000000000000000000"
  }
}
-----------------------------------
```

The first section is the query, and the second section is the result returned from the polywrapper you've just developed!

After you're done, be sure to run `yarn test:env:down` to teardown our testing docker environment.

## 8. Extra Credit
As you can see above, we've only tested the Query method we built, but not the mutation method.

Well, in order to test the mutation method, we'll have to create our own instance of the Web3ApiClient class pointed at the mainnet ganache fork running at 8546.

An example of how to do this can be found here:  
https://github.com/polywrap/monorepo/blob/prealpha/packages/apis/uniswapv2/src/__tests__/e2e/swap_e2e.spec.ts

Based on the project setup linked above, try to setup this project similarly with Jest testing. Use that setup to test the mutation method we added above.

## Recap
Building WebAssembly based SDKs has never been so easy. We've shown you how to define your own schemas, implementations, and import existing polywrappers into your own wrapper.

Polywrap is Web3 composability on steroids for dApp developers, and we hope that this simple tutorial is starting to give you a better idea of why this is so.

If you'd like to learn more, checkout our landing page & documentation:
https://polywrap.io

If you have any questions, don't hesitate to reach out:
http://discord.polywrap.io

## Resources
Try The Uniswap <> Polywrap Demo App:  
https://demo.uniswap.polywrap.io/

Checkout the Uniswap Polywrapper's source-code:  
https://github.com/polywrap/monorepo/tree/prealpha/packages/apis/uniswapv2
