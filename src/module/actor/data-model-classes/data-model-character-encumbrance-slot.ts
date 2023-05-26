/**
 * @file A class representing the "Complete" encumbrance scheme from Old School Essentials: Classic Fantasy
 */
import OseDataModelCharacterEncumbrance, {
  CharacterEncumbrance,
} from "./data-model-character-encumbrance";

// import { OSE } from '../../config';

/**
 * @todo Add template path for encumbrance bar
 * @todo Add template path for inventory item row
 */
export default class OseDataModelCharacterEncumbranceSlot
  extends OseDataModelCharacterEncumbrance
  implements CharacterEncumbrance
{
  static templateEncumbranceBar = "";

  static templateInventoryRow = "";

  /**
   * The machine-readable label for this encumbrance scheme
   */
  static type = "slot";

  /**
   * The human-readable label for this encumbrance scheme
   */
  static localizedLabel = "OSE.Setting.EncumbranceSlot";

  encumbranceSteps = {
    light: this.max - 6,
    medium: this.max - 4,
    heavy: this.max - 2,
  };

  #weight;

  constructor(
    max = OseDataModelCharacterEncumbrance.baseEncumbranceCap,
    items: Item[] = []
  ) {
    super(OseDataModelCharacterEncumbranceSlot.type, max);
    this.#weight = items.reduce(
      (acc, { type, system: { quantity, weight } }: Item) => {
        if (type === "item") return acc + quantity.value * weight;
        if (["weapon", "armor", "container"].includes(type))
          return acc + weight;
        return acc;
      },
      0
    );
  }

  get value(): number {
    return this.#weight;
  }

  // eslint-disable-next-line class-methods-use-this
  get steps() {
    return Object.values(this.encumbranceSteps);
  }

  get atHalfEncumbered() {
    return this.value >= this.encumbranceSteps.heavy;
  }

  get atThreeEighthsEncumbered() {
    return this.value >= this.encumbranceSteps.medium;
  }

  get atQuarterEncumbered() {
    return this.value >= this.encumbranceSteps.light;
  }
}
