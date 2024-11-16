import app from "./app";

const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch: app.fetch,
});

console.log("Scrowl Server Running ", server.port);

// const key = ethers.Wallet.createRandom();
// console.log(key.publicKey);
// console.log(key.privateKey);

export default app;
