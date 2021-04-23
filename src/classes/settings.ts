import { SETTINGS, DEV_SETTINGS, validate, validateOne, VALIDATORS, SizeStrategy } from '../inputs/index';
import { Settings as ISettings, DevSettings as IDevSettings, ICommonProps, ItemsProcessor } from '../interfaces/index';

export class Settings<Data = unknown> implements ISettings, IDevSettings {

  // user settings
  adapter: boolean;
  startIndex: number;
  minIndex: number;
  maxIndex: number;
  itemSize: number;
  bufferSize: number;
  padding: number;
  infinite: boolean;
  horizontal: boolean;
  windowViewport: boolean;
  viewportElement: HTMLElement | (() => void) | null;
  inverse: boolean; // if true, bwd padding element will have a priority when filling the viewport (if lack of items)
  onBeforeClip: ItemsProcessor | null;

  // development settings
  debug: boolean; // if true, logging is enabled; need to turn off when release
  immediateLog: boolean; // if false, logging is not immediate and could be done via Workflow.logForce call
  logTime: boolean; // if true, time differences will be logged
  logProcessRun: boolean; // if true, process fire/run info will be logged
  throttle: number; // if > 0, scroll event handling is throttled (ms)
  initDelay: number; // if set, the Workflow initialization will be postponed (ms)
  initWindowDelay: number; // if set and the entire window is scrollable, the Workflow init will be postponed (ms)
  cacheData: boolean; // if true, item's data will be cached along with item's size and index
  cacheOnReload: boolean; // if true, cache will not be flushed on reload
  changeOverflow: boolean; // if true, scroll will be disabled per each item's average size change
  dismissOverflowAnchor: boolean; // if true, the viewport will receive "overflowAnchor: none"
  sizeStrategy: SizeStrategy; // "average" | "frequent", determines behavior of unknown items

  // internal settings, managed by scroller itself
  instanceIndex: number;
  initializeDelay: number;
  viewport: HTMLElement | null;

  constructor(
    settings: ISettings<Data> | undefined, devSettings: IDevSettings | undefined, instanceIndex: number
  ) {
    this.parseInput(settings, SETTINGS);
    this.parseInput(devSettings, DEV_SETTINGS);
    this.instanceIndex = instanceIndex;
    this.initializeDelay = this.getInitializeDelay();
    this.viewport = this.getViewport();
    // todo: min/max indexes must be ignored if infinite mode is enabled ??
  }

  parseInput(input: ISettings<Data> | IDevSettings | undefined, props: ICommonProps<PropertyKey>): void {
    const result = validate(input, props);
    if (!result.isValid) {
      throw new Error('Invalid settings');
    }
    Object.entries(result.params).forEach(([key, par]) =>
      Object.assign(this, { [key]: par.value })
    );
  }

  getInitializeDelay(): number {
    let result = 0;
    if (this.windowViewport && this.initWindowDelay && !('scrollRestoration' in history)) {
      result = this.initWindowDelay;
    }
    if (this.initDelay > 0) {
      result = Math.max(result, this.initDelay);
    }
    return result;
  }

  getViewport(): HTMLElement | null {
    if (typeof this.viewportElement !== 'function') {
      return this.viewportElement;
    }
    const value = this.viewportElement();
    const result = validateOne({ value }, 'value', { validators: [VALIDATORS.ELEMENT] });
    if (!result.isValid) {
      return null; // fallback to default (null) if Function didn't return HTML element synchronously
    }
    return result.value as HTMLElement;
  }
}
