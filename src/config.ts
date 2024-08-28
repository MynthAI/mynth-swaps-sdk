import { Network } from "@lucid-evolution/lucid";
import { Err, Ok, Result } from "ts-handling";

const mainnet = {
  oneWay: {
    beacon:
      "963c30c084da1b1fd9424d2f4c613e3e53ed2cb8ba12503ca8367b4b6f6e652d776179",
    policy: "187989e3bfd1e88597c93b1c2eadb7cfa767e9d5084e4755298b782489072972",
    swap: "6f72e5890584bf2588abe436ecdb38265deb58616730794fa07a9f006f6e652d7761792d73776170",
  },
};

type Config = typeof mainnet;

const preview: Config = {
  oneWay: {
    beacon:
      "533d1963411dd0d5584c52b1fa6659f258af24e3e9c40796577eed1f6f6e652d7761792d626561636f6e",
    policy: "657a37d61bc04fefcba96142ae3a2d694cace39ae8ddbbb160ded9cf40d2f090",
    swap: "084da8fac9fe5633080dd4881b260a0c950dfc484fdab67d79a14c746f6e652d7761792d73776170",
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
