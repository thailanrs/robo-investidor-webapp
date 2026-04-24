const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    const historical = await yahooFinance.historical('PETR4.SA', { period1: '2019-01-01', period2: '2024-01-01' });
    console.log(historical.length);
  } catch(e) {
    console.error(e.message);
  }
}
test();
