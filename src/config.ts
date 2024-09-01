import { Network } from "@lucid-evolution/lucid";
import { Err, Ok, Result } from "ts-handling";

const mainnet = {
  oneWay: {
    beacon:
      "963c30c084da1b1fd9424d2f4c613e3e53ed2cb8ba12503ca8367b4b6f6e652d776179",
    policy: "187989e3bfd1e88597c93b1c2eadb7cfa767e9d5084e4755298b782489072972",
    swap: "6f72e5890584bf2588abe436ecdb38265deb58616730794fa07a9f006f6e652d7761792d73776170",
    forwarder:
      "2d50cc9620ea5ae9a72603a33b6eadc1df9fa7ce5c27744d6ad587d76f6e652d7761792d666f72776172646572",
  },
};

type Config = typeof mainnet;

const preview: Config = {
  oneWay: {
    beacon:
      "a168982cd17c45df7c468b527c32b0d3f97b8c297184c8860445e8ee6f6e652d7761792d626561636f6e2d6465627567",
    policy: "fa957d2b1dd37de2281dff8dd58c245baf1a7600067e3512056276c1787eb1e9",
    swap: "9e91cf1c285a3029a3517468025d2c9e3ec5a74928627a4603b6dd2d6f6e652d7761792d737761702d6465627567",
    forwarder:
      "8ed3a2a3871f49e25905cc7d057c94ecf6162e9502fc22caf30406ef6f6e652d7761792d666f727761726465722d6465627567",
  },
};

const get = (network: Network): Result<Config, string> => {
  switch (network) {
    case "Mainnet":
      return Ok(mainnet);

    case "Preview":
      return Ok(preview);

    default:
      return Err(`No config for ${network}`);
  }
};

export default get;
