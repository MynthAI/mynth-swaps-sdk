import cancelLimitOrder from "./cancel.js";
import fillOrder from "./fill.js";
import forwardOrder from "./forward.js";
import createLimitOrder from "./limit.js";
import attachMetadata, { Label, Metadata } from "./metadata.js";
import poaOrder from "./power-of-attorney.js";

type Label = typeof Label.in.infer;
type Metadata = typeof Metadata.in.infer;

export {
  attachMetadata,
  cancelLimitOrder,
  createLimitOrder,
  fillOrder,
  forwardOrder,
  Label,
  Metadata,
  poaOrder,
};
