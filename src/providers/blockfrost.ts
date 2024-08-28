import {
  Blockfrost as EBlockfrost,
  LucidEvolution,
} from "@lucid-evolution/lucid";
import { Blockfrost } from "cardano-ts";
import { Err, isProblem, Ok, Result } from "ts-handling";

const getBlockfrostProvider = (lucid: LucidEvolution) => {
  const provider = lucid.config().provider;
  if (provider instanceof EBlockfrost) return Ok(provider);
  return Err("Blockfrost provider isn't configured");
};

const loadBlockfrost = (lucid: LucidEvolution): Result<Blockfrost, string> => {
  const provider = getBlockfrostProvider(lucid).unwrap();
  return isProblem(provider)
    ? Err(provider.error)
    : Ok(new Blockfrost(provider.projectId));
};

export default loadBlockfrost;
