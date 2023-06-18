/**
 * @file The data model for Actors of type Monster
 */
// Encumbrance schemes
import OseDataModelCharacterEncumbranceDisabled from "./data-model-classes/data-model-character-encumbrance-disabled";
import OseDataModelCharacterSpells from "./data-model-classes/data-model-character-spells";
import OseDataModelCharacterMove from "./data-model-classes/data-model-character-move";

const getItemsOfActorOfType = (actor, filterType, filterFn = null) =>
  actor.items
    .filter(({ type }) => type === filterType)
    .filter(filterFn || (() => true));

export default class OseDataModelMonster extends foundry.abstract.DataModel {
  prepareDerivedData() {
    this.encumbrance = new OseDataModelCharacterEncumbranceDisabled();
    this.spells = new OseDataModelCharacterSpells(this.spells, this.#spellList);
    this.movement = new OseDataModelCharacterMove(
      this.encumbrance,
      this.config.movementAuto = false,
      this.movement.base
      );
  }

  // @todo define schema options; stuff like min/max values and so on.
  static defineSchema() {
    const { StringField, NumberField, BooleanField, ObjectField, SchemaField } =
      foundry.data.fields;

    return {
      spells: new ObjectField(),
      details: new ObjectField(),
      ac: new ObjectField(),
      aac: new ObjectField(),
      encumbrance: new SchemaField({
        value: new NumberField({ integer: false }),
        max: new NumberField({ integer: false }),
      }),
      movement: new ObjectField(),
      config: new ObjectField(),
      initiative: new ObjectField(),
      hp: new SchemaField({
        hd: new StringField(),
        value: new NumberField({ integer: true }),
        max: new NumberField({ integer: true }),
      }),
      thac0: new ObjectField(),
      languages: new ObjectField(),
      saves: new SchemaField({
        breath: new SchemaField({ value: new NumberField({ integer: true }) }),
        death: new SchemaField({ value: new NumberField({ integer: true }) }),
        paralysis: new SchemaField({
          value: new NumberField({ integer: true }),
        }),
        spell: new SchemaField({ value: new NumberField({ integer: true }) }),
        wand: new SchemaField({ value: new NumberField({ integer: true }) }),
      }),
      retainer: new SchemaField({
        enabled: new BooleanField(),
        loyalty: new NumberField({ integer: true }),
        wage: new StringField(),
      }),
    };
  }

  // @todo This only needs to be public until
  //       we can ditch sharing out AC/AAC.
  // eslint-disable-next-line class-methods-use-this
  get usesAscendingAC() {
    return game.settings.get(game.system.id, "ascendingAC");
  }

  get isNew() {
    return !Object.values(this.saves).reduce(
      (prev, curr) => prev + (parseInt(curr?.value, 10) || 0),
      0
    );
  }

  get containers() {
    return getItemsOfActorOfType(
      this.parent,
      "container",
      ({ system: { containerId } }) => !containerId
    );
  }

  get treasures() {
    return getItemsOfActorOfType(
      this.parent,
      "item",
      ({ system: { treasure, containerId } }) => treasure && !containerId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  get items() {
    return getItemsOfActorOfType(
      this.parent,
      "item",
      ({ system: { treasure, containerId } }) => !treasure && !containerId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  get weapons() {
    return getItemsOfActorOfType(
      this.parent,
      "weapon",
      ({ system: { containerId } }) => !containerId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  get armor() {
    return getItemsOfActorOfType(
      this.parent,
      "armor",
      ({ system: { containerId } }) => !containerId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  get abilities() {
    return getItemsOfActorOfType(
      this.parent,
      "ability",
      ({ system: { containerId } }) => !containerId
    ).sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  get attackPatterns() {
    return [...this.weapons, ...this.abilities]
      .sort((a, b) => {
        if (
          a.system.pattern !== "transparent" &&
          b.system.pattern === "transparent"
        )
          return -1;
        return b.type.localeCompare(a.type) || a.name.localeCompare(b.name);
      })
      .reduce((prev, curr) => {
        const updated = { ...prev };
        const { pattern } = curr.system;
        if (!updated[pattern]) updated[pattern] = [];
        return { ...updated, [pattern]: [...updated[pattern], curr] };
      }, {});
  }

  get #spellList() {
    return getItemsOfActorOfType(
      this.parent,
      "spell",
      ({ system: { containerId } }) => !containerId
    );
  }

  get isSlow() {
    return this.weapons.length === 0
      ? false
      : this.weapons.every(
          (item) => !(item.type !== "weapon" || !item.system.slow)
        );
  }

  get init() {
    const group = game.settings.get(game.system.id, "initiative") !== "group";

    return group ? this.initiative.mod : 0;
  }
}
