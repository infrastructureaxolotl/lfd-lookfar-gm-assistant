let threatsData = {};
let fluffData = {};

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

    const discoveryResponse = await fetch(
      "/modules/lfd-lookfar-gm-assistant/data/discoveries.json"
    );
    discoveryData = await discoveryResponse.json();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

Hooks.once("init", async () => {
  // Load the threats data
  await loadData();
  $(
    `<link rel="stylesheet" type="text/css" href="/modules/lfd-lookfar-gm-assistant/styles/style.css">`
  ).appendTo("head");

  // Register the game setting
  game.settings.register("lfd-lookfar-gm-assistant", "groupLevel", {
    name: "Group Level",
    hint: "Set the group level for generating dangers.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "5+": "5+",
      "20+": "20+",
      "40+": "40+",
    },
    default: "5",
  });

  game.settings.register("lfd-lookfar-gm-assistant", "rollVisibility", {
    name: "Roll Visibility",
    hint: "Choose whether rolls and chat outputs are public or GM only.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      public: "Public",
      gmOnly: "GM Only",
    },
    default: "public",
  });

  // Register "Treasure Hunter: Level" setting
  game.settings.register("lfd-lookfar-gm-assistant", "treasureHunterLevel", {
    name: "Treasure Hunter: Level",
    hint: "Modify the chance of discovery based on the level of Treasure Hunter skill.",
    scope: "world",
    config: true,
    type: Number,
    choices: {
      0: "Level 0",
      1: "Level 1",
      2: "Level 2",
    },
    default: 0,
  });

  // Register "Well-Traveled" setting
  game.settings.register("lfd-lookfar-gm-assistant", "wellTraveled", {
    name: "Well-Traveled",
    hint: "Check this if the party has the Well-Traveled trait, reducing travel roll difficulty.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  // Register text field for character name or message
  game.settings.register("lfd-lookfar-gm-assistant", "characterMessage", {
    name: "Character/Skill Message",
    hint: "Enter text that will display whenever the Travel Roll is affected by your group's Wayfarer.",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  Hooks.on("renderApplication", (app, html, data) => {
    if (!document.getElementById("floating-travel-check-button")) {
      // Create an icon element for the button
      let icon = $('<i class="fa-solid fa-person-hiking"></i>');

      // Create a list item with the class 'control-tool' and append the icon to it
      let listItem = $(
        '<li class="control-tool" id="floating-travel-check-button" title="Make a Travel Check"></li>'
      ).append(icon);

      // Append the list item to the specified location
      $(
        "#interface > #ui-left > #controls > ol.sub-controls.app.control-tools.flexcol.active"
      ).append(listItem);

      // Add click event listener to the list item
      listItem.click((ev) => {
        ev.preventDefault();
        showTravelCheckDialog();
      });
    }
  });
});

class TravelRolls {
  static travelChecks = {
    Minimal: "d6",
    Low: "d8",
    Medium: "d10",
    High: "d12",
    "Very High": "d20",
  };
}

function showTravelCheckDialog() {
  new Dialog({
    title: "Travel Check",
    content: formHtml,
    render: (html) => {
      html.addClass("ff6-dialog"); // Add custom font class only if the setting is true
    },
    buttons: {
      roll: {
        icon: '<i class="fas fa-check" style="color: white"></i>',
        label: '<span style="color: white;">Roll</span>',
        callback: (html) => {
          const selectedDifficulty = html
            .find('[name="travelCheck"]:checked')
            .val();
          handleRoll(selectedDifficulty);
        },
      },
    },
    default: "roll",
    close: () => {},
  }).render(true);
}

let formHtml = `
  <style>
    .travel-check-table {
      width: 100%;
      border-collapse: collapse;
    }
    .travel-check-table td, .travel-check-table th {
      padding: 5px;
      text-align: left;
      vertical-align: top;
    }
    .travel-check-table td:first-child {
      width: 1%;
      white-space: nowrap;
    }
  </style>
  <form>
    <table class="travel-check-table">
      <tbody>
        ${Object.entries(TravelRolls.travelChecks)
          .map(
            ([key, value], index) => `
          <tr>
            <td>
              <label>
                <input type="radio" name="travelCheck" value="${value}" ${
              index === 0 ? "checked" : ""
            }>
                ${key} (${value})
              </label>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </form>
`;

function shouldMakeDiscovery(rollResult) {
  const treasureHunterLevel = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "treasureHunterLevel"
  );
  // Adjusts the discovery condition
  return rollResult <= 1 + treasureHunterLevel;
}

// Reduces the dice size for well-traveled setting
function reduceDiceSize(diceSize) {
  const diceMap = { d8: "d6", d10: "d8", d12: "d10", d20: "d12" };
  return diceMap[diceSize] || diceSize; // Returns the reduced size, or the original if not found
}

async function handleRoll(selectedDifficulty) {
  const wellTraveled = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "wellTraveled"
  );
  const characterMessage = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "characterMessage"
  );

  // Reduce the dice size if Well-Traveled is checked
  if (wellTraveled) {
    selectedDifficulty = reduceDiceSize(selectedDifficulty);
    if (characterMessage) {
      ChatMessage.create({
        content: characterMessage, //change this to whatever you want to use to acknowledge your friendly neighborhood Wayfarer
      });
    }
  }

  let roll = new Roll(selectedDifficulty);
  await roll.roll();

  // Determine visibility
  const rollVisibility = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "rollVisibility"
  );
  const isWhisper = rollVisibility === "gmOnly";

  // Get the IDs of all GM users if visibility is set to "gmOnly"
  let gmUserIds = isWhisper
    ? game.users.filter((user) => user.isGM).map((gm) => gm.id)
    : [];
  // Render and create the roll chat message
  roll.render().then((rollHTML) => {
    ChatMessage.create({
      user: game.user._id,
      speaker: { alias: "System" },
      content: rollHTML,
      whisper: gmUserIds,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll,
    });
  });

  // Determine the group level set by the GM
  const groupLevel = game.settings.get(
    "lfd-lookfar-gm-assistant",
    "groupLevel"
  );

  let resultMessage = "";

  if (roll.total >= 6) {
    resultMessage = "Danger! " + generateDanger(groupLevel);
  } else if (shouldMakeDiscovery(roll.total)) {
    resultMessage = "Discovery! " + generateDiscovery();
  } else {
    resultMessage = "The travel day passed without incident.";
  }

  // Show the reroll dialog but do not send the message to chat yet
  showRerollDialog(resultMessage, selectedDifficulty, groupLevel);
}

// Ensure that 'showRerollDialog' sends the message to chat only when 'Keep Result' is selected
function showRerollDialog(initialResult, selectedDifficulty, groupLevel) {
  let d = new Dialog({
    title: "Confirm Danger Result",
    render: (html) => {
      html.addClass("ff6-dialog");
    },
    content: `<p>Current Result: ${initialResult}</p><p>Do you want to keep this result or reroll?</p>`,
    buttons: {
      keep: {
        icon: '<i class="fas fa-check" style="color: white></i>',
        label: '<span style="color: white;">Keep Result</span>',
        callback: () => {
          // Determine visibility
          const rollVisibility = game.settings.get(
            "lfd-lookfar-gm-assistant",
            "rollVisibility"
          );
          const isWhisper = rollVisibility === "gmOnly";
          // Get the IDs of all GM users if visibility is set to "gmOnly"
          let gmUserIds = isWhisper
            ? game.users.filter((user) => user.isGM).map((gm) => gm.id)
            : [];

          ChatMessage.create({
            content: initialResult,
            whisper: gmUserIds,
            speaker: { alias: "System" },
          });
        },
      },
      reroll: {
        icon: '<i class="fas fa-redo" style="color: white></i>',
        label: '<span style="color: white;">Reroll Result</span>',
        callback: () => {
          const newDangerResult = generateDanger(groupLevel);
          const newResultMessage = "Danger! " + newDangerResult;
          showRerollDialog(newResultMessage, selectedDifficulty, groupLevel);
        },
      },
    },
    default: "keep",
    close: () => {},
  });
  d.render(true);
}

function generateDanger(groupLevel) {
  // Ensure that threatsData is loaded and contains the required keys
  if (
    !threatsData ||
    !threatsData.threats ||
    !threatsData.threats.statusEffects
  ) {
    console.error("Threats data is not fully loaded.");
    return "Error: Data not available.";
  }

  const severity = randomSeverity();
  const threatType = randomThreatType();
  const fluffDescription = getRandomElement(fluffData);

  console.log("Group Level:", groupLevel);
  console.log("Damage Data:", threatsData.threats.Damage);
  console.log("Generated Threat Type:", threatType);
  console.log(
    "Threats Data at Group Level:",
    threatsData.threats.Damage[groupLevel]
  );
  console.log("Status Effects Data:", threatsData.threats.statusEffects); // Debugging

  let result = `<strong>${severity} ${threatType}:</strong> `;

  switch (threatType) {
    case "Damage":
      result += handleDamage(threatsData, groupLevel, severity);
      break;
    case "statusEffect":
      result += handleStatusEffect(threatsData, severity, groupLevel);
      break;
    case "Combat":
      result += threatsData.threats.Combat[severity];
      break;
    case "dangerClock":
      result += threatsData.threats.dangerClock[severity];
      break;
    case "villainPlanAdvance":
      result += threatsData.threats.villainPlanAdvance[severity];
      break;
    default:
      console.error("Unknown threat type:", threatType);
      return "Error: Unknown threat type.";
  }

  return `<table style="width:100%"><tr><td>${result}</td></tr><tr><td><strong>Source:</strong> ${fluffDescription}</td></tr></table>`;
}

function handleDamage(threatsData, groupLevel, severity) {
  if (
    !threatsData.threats.Damage[groupLevel] ||
    !threatsData.threats.Damage[groupLevel][severity]
  ) {
    console.error("Damage data not found for:", groupLevel, severity);
    return "Error: Damage data not found.";
  }
  return `${threatsData.threats.Damage[groupLevel][severity]} damage`;
}

function handleStatusEffect(threatsData, severity, groupLevel) {
  if (severity === "Heavy") {
    const statusEffect = getRandomElement(
      threatsData.threats.statusEffects["Minor"]
    );
    const minorDamage = threatsData.threats.Damage[groupLevel]["Minor"];
    return `${statusEffect} and ${minorDamage} damage`;
  } else {
    return getRandomElement(threatsData.threats.statusEffects[severity]);
  }
}

function randomSeverity() {
  const roll = Math.random();
  return roll < 0.6 ? "Minor" : roll < 0.9 ? "Heavy" : "Massive";
}

function randomThreatType() {
  const types = [
    "Damage",
    "statusEffect",
    "Combat",
    "dangerClock",
    "villainPlanAdvance",
  ];
  return getRandomElement(types);
}

function getRandomElement(arrayOrObject) {
  const isObject =
    typeof arrayOrObject === "object" && !Array.isArray(arrayOrObject);
  const keys = isObject ? Object.keys(arrayOrObject) : arrayOrObject;
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return isObject ? arrayOrObject[randomKey] : randomKey;
}

function generateDiscovery() {
  if (
    !discoveryData ||
    !discoveryData.adjectives ||
    !discoveryData.nouns ||
    !discoveryData.effects
  ) {
    console.error("Discoveries data is not fully loaded.");
    return "Error: Data not available for discoveries.";
  }

  // Generate keywords
  const keywords = [];
  const totalKeywords = Math.floor(Math.random() * 3) + 8; // Generates between 8 to 10
  for (let i = 0; i < totalKeywords; i++) {
    const wordList =
      i % 2 === 0 ? discoveryData.adjectives : discoveryData.nouns;
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    keywords.push(word);
  }

  // Select a random effect from the discoveries
  const effectsKeys = Object.keys(discoveryData.effects);
  const randomEffectKey =
    effectsKeys[Math.floor(Math.random() * effectsKeys.length)];
  const effectDescription = discoveryData.effects[randomEffectKey];

  // Combine the effect with the keywords
  return `
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px; border: 1px solid #ddd;"><strong>Effect:</strong></td>
        <td style="padding: 5px; border: 1px solid #ddd;">${randomEffectKey}: ${effectDescription}</td>
      </tr>
      <tr>
        <td style="padding: 5px; border: 1px solid #ddd;"><strong>Keywords:</strong></td>
        <td style="padding: 5px; border: 1px solid #ddd;">${keywords.join(
          ", "
        )}</td>
      </tr>
    </table>
  `;
}
