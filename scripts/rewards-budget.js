let currencyTracker = {
  totalCurrency: 0,
  currencyName: "zenit",
  transactions: [],
};

Hooks.once("init", () => {
  // Register the currency name setting
  game.settings.register("lookfar-fu", "currencyName", {
    name: "Monetary Unit",
    hint: "What is currency called in your setting?",
    scope: "world",
    config: true,
    type: String,
    default: "zenit",
    onChange: (value) => {
      currencyTracker.currencyName = value;
    },
  });

  // Initialize currency name from settings
  currencyTracker.currencyName = game.settings.get(
    "lookfar-fu",
    "currencyName"
  );
});

// Function to add currency
function addCurrency(amount) {
  currencyTracker.totalCurrency += amount;
  currencyTracker.transactions.push({ type: "add", amount: amount });
  // Update UI or perform other actions as necessary
}

// Function to subtract currency
function subtractCurrency(amount) {
  currencyTracker.totalCurrency -= amount;
  currencyTracker.transactions.push({ type: "subtract", amount: amount });
}

// Function to get the total currency
function getTotalCurrency() {
  return currencyTracker.totalCurrency;
}
