import { type } from "arktype";
import { Err, Ok } from "ts-handling";
import { RewardAddress } from "../../validation";
import Extension from "./extension.js";

class PowerOfAttorney extends Extension {
  static create($authority: RewardAddress) {
    const authority = RewardAddress($authority);
    if (authority instanceof type.errors) return Err(authority.summary);

    return Ok(new PowerOfAttorney(authority, ""));
  }
}

export default PowerOfAttorney;
