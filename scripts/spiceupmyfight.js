import { dataLoader } from "./dataLoader.js";

function getGroupLevel() {
  return game.settings.get("lfd-lookfar-gm-assistant", "groupLevel");
}

Hooks.once("init", async () => {
  await dataLoader.loadData();
  $(
    `<link rel="stylesheet" type="text/css" href="/modules/lfd-lookfar-gm-assistant/styles/style.css">`
  ).appendTo("head");

  Hooks.on("renderApplication", (app, html, data) => {
    window.showSpiceUp = {
      showSpiceDialog: showSpiceDialog
    };

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
    }
  });

  function getRandomItem(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    const selectedItem = array[randomIndex];
    // Check if the item is an object and has the 'item' property
    return typeof selectedItem === "object" && selectedItem.item
      ? selectedItem.item
      : selectedItem;
  }
  function randomSeverity() {
    const roll = Math.random();
    return roll < 0.6 ? "Minor" : roll < 0.9 ? "Heavy" : "Massive";
  }

  function getRandomStatusEffect(severity) {
    const statusEffects =
      dataLoader.threatsData.threats.statusEffects[severity];

    // Fallback to Minor status effects for Heavy if it's empty
    if (statusEffects.length === 0) {
      if (severity === "Heavy") {
        const minorEffects =
          dataLoader.threatsData.threats.statusEffects["Minor"];
        return minorEffects.length > 0
          ? minorEffects[Math.floor(Math.random() * minorEffects.length)]
          : null;
      }
      return null;
    }

    // Select a random status effect for non-empty arrays
    return statusEffects[Math.floor(Math.random() * statusEffects.length)];
  }

  function generateRandomBattleEffect() {
    const groupLevel = getGroupLevel();
    const severity = randomSeverity();
    const randomTarget = getRandomItem(dataLoader.battleEffectsData.target);
    const randomStatusEffect = getRandomStatusEffect(severity);
    const randomGimmick = getRandomGimmick();
    const randomEnvironmentEffect = getRandomItem(
      dataLoader.battleEffectsData.environment
    );

    let effectWithReplacements = randomEnvironmentEffect
      .replace(/{target}/g, randomTarget)
      .replace(/{actions}/g, () =>
        getRandomItem(dataLoader.battleEffectsData.actions)
      )
      .replace(
        /{statusEffects}/g,
        dataLoader.randomStatusEffect || "No Status Effect"
      );

    if (effectWithReplacements.includes("{threats.damage.level}")) {
      const damageLevel =
        dataLoader.threatsData.threats.Damage[groupLevel][severity];
      effectWithReplacements = effectWithReplacements.replace(
        /{threats.damage.level}/g,
        damageLevel
      );
    }
    let gimmickWithReplacements = randomGimmick;
    if (gimmickWithReplacements.includes("{threats.damage.level}")) {
      const damageLevel =
        dataLoader.threatsData.threats.Damage[groupLevel][severity];
      gimmickWithReplacements = gimmickWithReplacements.replace(
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
    effectWithReplacements = effectWithReplacements.replace(/{element}/g, () =>
      getRandomItem(dataLoader.battleEffectsData.element)
    );
    return {
      effect: effectWithReplacements,
      gimmick: gimmickWithReplacements,
    };
  }

  function getRandomGimmick() {
    const randomIndex = Math.floor(
      Math.random() * dataLoader.battleEffectsData.gimmick.length
    );
    return dataLoader.battleEffectsData.gimmick[randomIndex].item;
  }

  function showSpiceDialog() {
    const { effect, gimmick } = generateRandomBattleEffect();
    createSpiceDialog(effect, gimmick);
  }

  function createSpiceDialog(battleEffect, randomGimmick) {
    let formHtml = `
    <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
        <tr>
            <th style="text-align: left; border-bottom: 1px solid #ddd;">Effect</th>
        </tr>
        <tr>
            <td style="padding: 5px;">${battleEffect}</td>
        </tr>
    </table>
    <table style="width:100%; border-collapse: collapse;">
        <tr>
            <th style="text-align: left; border-bottom: 1px solid #ddd;">Gimmick</th>
        </tr>
        <tr>
            <td style="padding: 5px;">${randomGimmick}</td>
        </tr>
    </table>`;

    new Dialog({
      title: "Spice Up My Fight!",
      content: formHtml,
      render: (html) => {
        html.addClass("ff6-dialog");
      },
      buttons: {
        reroll: {
          icon: '<i class="fas fa-dice" style="color: white"></i>',
          label: '<span style="color: white;">Reroll</span>',
          callback: () => showSpiceDialog(),
        },
        keep: {
          icon: '<i class="fas fa-check" style="color: white"></i>',
          label: '<span style="color: white;">Keep</span>',
          callback: () =>
            outputToChat(`${battleEffect}<br>Gimmick: ${randomGimmick}`),
        },
        close: {
          icon: '<i class="fas fa-times" style="color: white"></i>',
          label: '<span style="color: white;">Close</span>',
        },
      },
      default: "keep",
      close: () => { },
    }).render(true);
  }

  function outputToChat(message) {
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: message,
    });
  }
});
