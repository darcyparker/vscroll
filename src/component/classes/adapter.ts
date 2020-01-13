import { BehaviorSubject, Subject } from 'rxjs';

import { Scroller } from '../scroller';
import { AdapterContext } from './adapterContext';
import { protectAdapterPublicMethod } from '../utils/index';
import {
  Adapter as IAdapter, Process, ProcessSubject, ProcessStatus, ItemAdapter, ItemsPredicate, ClipOptions
} from '../interfaces/index';

export class Adapter implements IAdapter {

  private context: AdapterContext;
  init$: BehaviorSubject<boolean>;

  get init(): boolean {
    return this.context.init;
  }

  get version(): string | null {
    return this.context.version;
  }

  get isLoading(): boolean {
    return this.context.isLoading;
  }

  get isLoading$(): Subject<boolean> {
    return this.context.isLoading$;
  }

  get loopPending(): boolean {
    return this.context.loopPending;
  }

  get loopPending$(): Subject<boolean> {
    return this.context.loopPending$;
  }

  get cyclePending(): boolean {
    return this.context.cyclePending;
  }

  get cyclePending$(): Subject<boolean> {
    return this.context.cyclePending$;
  }

  get itemsCount(): number {
    return this.context.itemsCount;
  }

  get bof(): boolean {
    return this.context.bof;
  }

  get eof(): boolean {
    return this.context.eof;
  }

  get firstVisible(): ItemAdapter {
    return this.context.firstVisible;
  }

  get firstVisible$(): BehaviorSubject<ItemAdapter> {
    return this.context.firstVisible$;
  }

  get lastVisible(): ItemAdapter {
    return this.context.lastVisible;
  }

  get lastVisible$(): BehaviorSubject<ItemAdapter> {
    return this.context.lastVisible$;
  }

  constructor() {
    this.init$ = new BehaviorSubject<boolean>(false);
    this.context = new AdapterContext(this.init$);

    ['reload', 'append', 'prepend', 'check', 'remove', 'clip', 'showLog', 'fix']
      .forEach(token => protectAdapterPublicMethod(this, token));
  }

  initialize(scroller: Scroller) {
    this.context.initialize(scroller);
  }

  reload(reloadIndex?: number | string) {
    this.context.logger.log(() => `adapter: reload(${reloadIndex})`);
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.reload,
      status: ProcessStatus.start,
      payload: reloadIndex
    });
  }

  append(items: any, eof?: boolean) {
    this.context.logger.log(() => {
      const count = Array.isArray(items) ? items.length : 1;
      return `adapter: append([${count}], ${!!eof})`;
    });
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.append,
      status: ProcessStatus.start,
      payload: { items, eof }
    });
  }

  prepend(items: any, bof?: boolean) {
    this.context.logger.log(() => {
      const count = Array.isArray(items) ? items.length : 1;
      return `adapter: prepend([${count}], ${!!bof})`;
    });
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.prepend,
      status: ProcessStatus.start,
      payload: { items, bof }
    });
  }

  check() {
    this.context.logger.log(() => `adapter: check()`);
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.check,
      status: ProcessStatus.start
    });
  }

  remove(predicate: ItemsPredicate) {
    this.context.logger.log(() => `adapter: remove()`);
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.remove,
      status: ProcessStatus.start,
      payload: predicate
    });
  }

  clip(options?: ClipOptions) {
    this.context.logger.log(() => `adapter: clip(${options ? JSON.stringify(options) : ''})`);
    this.context.callWorkflow(<ProcessSubject>{
      process: Process.userClip,
      status: ProcessStatus.start,
      payload: options
    });
  }

  showLog() {
    this.context.logger.log(() => `adapter: showLog()`);
    this.context.logger.logForce();
  }

  // undocumented
  fix(params: any) {
    this.context.logger.log(() => `adapter: fix(${JSON.stringify(params)})`);
    if (!params || typeof params !== 'object') {
      this.context.logger.log(() => `can't set params; argument must be a valid object`);
      return;
    }
    ['scrollPosition', 'minIndex', 'maxIndex'].forEach((token: string) => {
      if (params.hasOwnProperty(token)) {
        const value = Number(params[token]);
        const parsedValue = parseInt(<any>params[token], 10);
        if (value !== parsedValue) {
          this.context.logger.log(() => `can't set ${token}; argument must be an integer`);
        } else {
          (<any>this.context.fix)[token](value);
        }
      }
    });
  }
}
