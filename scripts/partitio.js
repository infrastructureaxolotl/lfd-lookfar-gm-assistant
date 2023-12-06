import { dataLoader } from "./dataLoader.js";

let currencyTracker = {
  totalCurrency: 0,
  currencyName: "zenit",
  transactions: [],
};

Hooks.once("init", async () => {
  await dataLoader.loadData();

  Hooks.on("renderApplication", (app, html, data) => {
    if (!document.getElementById("floating-Coin-button")) {
      let icon = $('<i class="fa-solid fa-coins"></i>');

      let listItem = $(
        '<li class="control-tool" id="floating-Coin-button" title="Partitio"></li>'
      ).append(icon);

      $(
        "#interface > #ui-left > #controls > ol.sub-controls.app.control-tools.flexcol.active"
      ).append(listItem);

      listItem.click((ev) => {
        ev.preventDefault();
        showSpiceDialog();
      });
    }
  });

  game.settings.register("lfd-lookfar-gm-assistant", "currencyName", {
    name: "Monetary Unit",
    hint: "What is money called in your setting?",
    scope: "world",
    config: true,
    type: String,
    default: "zenit",
    onChange: (value) => {
      currencyTracker.currencyName = value;
    },
  });

  game.settings.register("lfd-lookfar-gm-assistant", "highestPCLevel", {
    name: "Highest PC Level",
    hint: "What is the highest level any player has reached?",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
  });

  game.settings.register("lfd-lookfar-gm-assistant", "numberOfPlayers", {
    name: "Player Count",
    hint: "How many players are in the party?",
    scope: "world",
    config: true,
    type: Number,
    default: 4,
  });

  currencyTracker.currencyName = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "currencyName"
  );
});
