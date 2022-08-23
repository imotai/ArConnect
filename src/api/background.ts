import { Runtime } from "webextension-polyfill-ts";
import { Module } from "./module";

// import modules
import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.background";
import activeAddressModule from "./modules/active_address";
import activeAddress from "./modules/active_address/active_address.background";
import allAddressesModule from "./modules/all_addresses";
import allAddresses from "./modules/all_addresses/all_addresses.background";
import publicKeyModule from "./modules/public_key";
import publicKey from "./modules/public_key/public_key.background";
import walletNamesModule from "./modules/wallet_names";
import walletNames from "./modules/wallet_names/wallet_names.background";
import arweaveConfigModule from "./modules/arweave_config";
import arweaveConfig from "./modules/arweave_config/arweave_config.background";

/** Background modules */
const modules: BackgroundModule<any>[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress },
  { ...allAddressesModule, function: allAddresses },
  { ...publicKeyModule, function: publicKey },
  { ...walletNamesModule, function: walletNames },
  { ...arweaveConfigModule, function: arweaveConfig }
];

export default modules;

/** Extended module interface */
interface BackgroundModule<T> extends Module<T> {
  function: ModuleFunction<T>;
}

/**
 * Extended module function
 */
export type ModuleFunction<ResultType> = (
  port: Runtime.Port,
  ...params: any[]
) => Promise<ResultType> | ResultType;
