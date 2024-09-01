import { Ok, Result } from "ts-handling";
import Extension from "./extension.js";

class NullExtension extends Extension {
  static create() {
    return new NullExtension("", "");
  }

  get(): Result<[string, string], string> {
    return Ok(["", ""]);
  }
}

const $NullExtension = NullExtension.create();

export default $NullExtension;
