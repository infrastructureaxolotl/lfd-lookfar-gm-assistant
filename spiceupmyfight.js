let threatsData = {};
let fluffData = {};
let battleEffectsData = {};

function getGroupLevel() {
  return game.settings.get("lfd-lookfar-gm-assistant", "groupLevel");
}

async function loadData() {
  try {
    const threatsResponse = await fetch(
      "/modules/lfd-lookfar-gm-assistant/data/data.json"
    );
    threatsData = await threatsResponse.json();

    const fluffResponse = await fetch(
      "/modules/lfd-lookfar-gm-assistant/data/fluff.json"
    );
    fluffData = await fluffResponse.json();

    const battleEffectsResponse = await fetch(
      "/modules/lfd-lookfar-gm-assistant/data/battleEffects.json"
    );
    discoveryData = await battleEffectsResponse.json();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

Hooks.once("init", async () => {
  await loadData();
  $(
    `<link rel="stylesheet" type="text/css" href="/modules/lfd-lookfar-gm-assistant/static/style.css">`
  ).appendTo("head");

  Hooks.on("renderApplication", (app, html, data) => {
    if (!document.getElementById("floating-fightSpice-button")) {
      let icon = $('<i class="fa-solid fa-pepper-hot"></i>');

      let listItem = $(
        '<li class="control-tool" id="floating-fightSpice-button" title="Add some spice to this fight!"></li>'
      ).append(icon);

      $(
        "#interface > #ui-left > #controls > ol.sub-controls.app.control-tools.flexcol.active"
      ).append(listItem);

      listItem.click((ev) => {
        ev.preventDefault();
        showSpiceDialog();
      });

      $("head").append(`<style>${css}</style>`);
    }
  });

  function getRandomItem(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex].item;
  }

  function randomSeverity() {
    const roll = Math.random();
    return roll < 0.6 ? "Minor" : roll < 0.9 ? "Heavy" : "Massive";
  }

  function getRandomStatusEffect(severity) {
    const statusEffects = threatsData.threats.statusEffects[severity];
    if (statusEffects.length === 0) return null;
    return statusEffects[Math.floor(Math.random() * statusEffects.length)];
  }

  function generateRandomBattleEffect() {
    if (effectWithReplacements.includes("{threats.damage.level}")) {
      const damageLevel = threatsData.threats.Damage[groupLevel][severity];
      effectWithReplacements = effectWithReplacements.replace(
        /{threats.damage.level}/g,
        damageLevel.toString()
      );
    }
    const keywords = [];
    const totalKeywords = Math.floor(Math.random() * 3) + 8; // Generates between 8 to 10
    for (let i = 0; i < totalKeywords; i++) {
      const wordList =
        i % 2 === 0 ? discoveryData.adjectives : discoveryData.nouns;
      const word = wordList[Math.floor(Math.random() * wordList.length)];
      keywords.push(word);
    }
    const groupLevel = getGroupLevel();
    const severity = randomSeverity();
    const randomElement = getRandomItem(battleEffectsData.element);
    const randomTarget = getRandomItem(battleEffectsData.target);

    const randomStatusEffect = getRandomStatusEffect(severity);

    const randomEnvironmentEffect = getRandomItem(
      battleEffectsData.environment
    );

    let effectWithReplacements = randomEnvironmentEffect
      .replace(/{element}/g, randomElement)
      .replace(/{target}/g, randomTarget);

    if (effectWithReplacements.includes("{threats.damage.level}")) {
      const damageLevel = threatsData.threats.Damage[groupLevel][severity];
      effectWithReplacements = effectWithReplacements.replace(
        /{threats.damage.level}/g,
        damageLevel
      );
    }

    if (
      randomStatusEffect &&
      effectWithReplacements.includes("{statusEffects}")
    ) {
      effectWithReplacements = effectWithReplacements.replace(
        /{statusEffects}/g,
        randomStatusEffect
      );
    }

    return effectWithReplacements;
  }

  function showSpiceDialog() {
    let battleEffect = generateRandomBattleEffect();
    let formHtml = `<p>Generated Effect: ${battleEffect}</p>`;

    function updateDialog() {
      battleEffect = generateRandomBattleEffect();
      $(".ff6-dialog").html(`<p>Generated Effect: ${battleEffect}</p>`);
    }

    function keepEffect() {
      outputToChat(battleEffect);
    }

    new Dialog({
      title: "Let's add some complexity to this battle",
      content: formHtml,
      render: (html) => {
        html.addClass("ff6-dialog");
      },
      buttons: {
        reroll: {
          icon: '<i class="fas fa-dice" style="color: white"></i>',
          label: '<span style="color: white;">Reroll</span>',
          callback: () => updateDialog(),
        },
        keep: {
          icon: '<i class="fas fa-check" style="color: white"></i>',
          label: '<span style="color: white;">Keep</span>',
          callback: () => keepEffect(),
        },
      },
      default: "keep",
      close: () => {},
    }).render(true);
  }

  function outputToChat(message) {
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: message,
    });
  }
});
