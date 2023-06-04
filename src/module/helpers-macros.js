/**
 * @file Functions that make working with hotbar macros easier
 */
import {rollTreasure} from "./helpers-treasure";
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 *
 * @param {object} data - The dropped data
 * @param {number} slot - The hotbar slot to use
 * @returns {Promise} - Promise of assigned macro or a notification
 */
export async function createOseMacro(data, slot) {
  if (data.type === "Macro") {
    return game.user.assignHotbarMacro(await fromUuid(data.uuid), slot);
  }
  if (data.type === "RollTable") {
    const command = `game.ose.rollTableMacro("${data.uuid}");`;
    const table = await fromUuid(data.uuid);
    const macro = await Macro.create({
      name: table.name,
      type: "script",
      img: table.img,
      command,
      flags: { "ose.tableMacro": true },
    });
    return game.user.assignHotbarMacro(macro, slot);
  }
  if (data.type !== "Item")
    return ui.notifications.warn(
      game.i18n.localize("OSE.warn.macrosNotAnItem")
    );
  if (data.uuid.indexOf("Item.") <= 0)
    return ui.notifications.warn(
      game.i18n.localize("OSE.warn.macrosOnlyForOwnedItems")
    );
  const { item } = data;

  // Create the macro command
  const command = `game.ose.rollItemMacro("${item.name}");`;
  let macro = game.macros.contents.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro || macro.ownership[game.userId] === undefined) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "ose.itemMacro": true },
    });
  }
  return game.user.assignHotbarMacro(macro, slot);
}

/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 *
 * @param {string} itemName - Name of item to roll
 * @returns {Promise} - Promise of item roll or notification
 */
export function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  // Active actor, or inactive actor + token on scene allowed
  if (!(speaker.actor && speaker.scene))
    return ui.notifications.warn(
      game.i18n.localize("OSE.warn.macrosNoTokenOwnedInScene")
    );

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  // Get matching items
  const items = actor ? actor.items.filter((i) => i.name === itemName) : [];
  if (items.length > 1) {
    ui.notifications.warn(
      game.i18n.format("OSE.warn.moreThanOneItemWithName", {
        actorName: actor.name,
        itemName,
      })
    );
  } else if (items.length === 0) {
    return ui.notifications.error(
      game.i18n.format("OSE.error.noItemWithName", {
        actorName: actor.name,
        itemName,
      })
    );
  }
  const item = items[0];

  // Trigger the item roll
  return item.roll();
}

/**
 * Roll on a RollTable by uuid if it exists.
 *
 * @param {string} tableUuId - UuId of the RollTable
 */
export function rollTableMacro(tableUuId) {
  fromUuid(tableUuId).then((table) => {
    if (table === null) {
      return ui.notifications.error(
        game.i18n.format("OSE.error.noRollTableWithUuId", {
          uuid: tableUuId,
        })
      );
    }
    //

    if (table.getFlag(game.system.id, "treasure")) {
      return rollTreasure(table);
    }
    return table.draw({ displayChat: true });
  });
}
