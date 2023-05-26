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

  #weight;

  private encumbranceSteps: {
    quarter: number;
    threeEighths: number;
    half: number;
  };

  constructor(
    max = OseDataModelCharacterEncumbrance.baseEncumbranceCap,
    items: Item[] = []
  ) {
    super(OseDataModelCharacterEncumbranceSlot.type, max);
    this.#weight = items.reduce(
      (acc, { type, system: { quantity, weight } }: Item) => {
        if (type === "item") return acc + Math.ceil(quantity.value * weight);
        if (["weapon", "armor", "container"].includes(type))
          return acc + Math.ceil(weight);
        return acc;
      },
      0
    );

    this.encumbranceSteps = {
      quarter: this.max - 6,
      threeEighths: this.max - 4,
      half: this.max - 2,
    };
  }

  get value(): number {
    return Math.ceil(this.#weight);
  }

  // eslint-disable-next-line class-methods-use-this
  get steps() {
    return Object.values(this.encumbranceSteps).map(
      (s) => 100 * (s / this.max)
    );
  }

  get atHalfEncumbered() {
    return this.value >= this.encumbranceSteps.half;
  }

  get atThreeEighthsEncumbered() {
    return this.value >= this.encumbranceSteps.threeEighths;
  }

  get atQuarterEncumbered() {
    return this.value >= this.encumbranceSteps.quarter;
  }
}
