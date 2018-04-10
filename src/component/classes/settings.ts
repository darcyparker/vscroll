import { Settings as SettingsInterface, DevSettings as DevSettingsInterface } from '../interfaces/settings';
import { assignSettings } from '../utils/assignSettings';

export const defaultSettings: SettingsInterface = {
  startIndex: 1,
  bufferSize: 5,
  padding: 0.5,
  infinite: false,
  horizontal: false
};

export const minSettings: SettingsInterface = {
  bufferSize: 1,
  padding: 0.1
};

export const defaultDevSettings: DevSettingsInterface = {
  debug: false, // logging is enabled if true; need to turn off in release
  immediateLog: true, // logging is not immediate if false, it could be forced via Workflow.logForce call
  itemIdPrefix: '', // todo : scroll instance index ?
  clipAfterFetchOnly: true,
  clipAfterScrollOnly: true,
  paddingForwardSize: 0,
  paddingBackwardSize: 0
};

export class Settings implements SettingsInterface {

  // external settings
  startIndex;
  bufferSize;
  padding;
  infinite;
  horizontal;

  // internal dev settings
  debug;
  immediateLog;
  itemIdPrefix;
  clipAfterFetchOnly;
  clipAfterScrollOnly;
  paddingForwardSize;
  paddingBackwardSize;

  constructor(settings?: SettingsInterface, devSettings?: DevSettingsInterface) {
    assignSettings(this, settings, defaultSettings, minSettings);
    Object.assign(this, defaultDevSettings, devSettings);
  }
}
