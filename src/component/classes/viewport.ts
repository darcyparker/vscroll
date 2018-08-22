import { ElementRef } from '@angular/core';

import { Padding } from './padding';
import { Direction } from '../interfaces/index';
import { Settings } from './settings';
import { Routines } from './domRoutines';
import { Logger } from './logger';

export class ViewportPadding {
  forward: Padding;
  backward: Padding;

  constructor(element: HTMLElement, hostElement: HTMLElement, routines: Routines, settings: Settings) {
    this.forward = new Padding(element, hostElement, Direction.forward, routines, settings.paddingForwardSize);
    this.backward = new Padding(element, hostElement, Direction.backward, routines, settings.paddingBackwardSize);
  }

  reset() {
    this.forward.reset();
    this.backward.reset();
  }
}

export class Viewport {

  padding: ViewportPadding;
  startDelta: number;
  syntheticScrollPosition: number | null;
  syntheticScrollPositionBefore: number;
  syntheticScrollDelta: number;
  syntheticScrollTime: number;

  readonly element: HTMLElement;
  readonly host: HTMLElement;
  readonly scrollable: HTMLElement;
  readonly settings: Settings;
  readonly routines: Routines;
  readonly logger: Logger;

  constructor(elementRef: ElementRef, settings: Settings, routines: Routines, logger: Logger) {
    this.settings = settings;
    this.routines = routines;
    this.logger = logger;
    this.element = elementRef.nativeElement;
    this.startDelta = settings.paddingBackwardSize || 0;
    this.syntheticScrollPosition = null;

    if (settings.windowViewport) {
      this.host = this.element.ownerDocument.body;
      this.scrollable = <HTMLElement>this.element.ownerDocument.documentElement;
    } else {
      this.host = <HTMLElement>this.element.parentElement;
      this.scrollable = <HTMLElement>this.element.parentElement;
    }

    this.padding = new ViewportPadding(this.element, this.host, this.routines, settings);
  }

  reset() {
    this.scrollPosition = 0;
    this.syntheticScrollPosition = null;
    this.syntheticScrollPositionBefore = 0;
    this.syntheticScrollDelta = 0;
    this.syntheticScrollTime = 0;
    this.padding.reset();
    this.startDelta = 0;
  }

  get scrollEventElement() {
    return this.settings.windowViewport ? this.element.ownerDocument : this.host;
  }

  get children(): HTMLCollection {
    return this.element.children;
  }

  get scrollPosition(): number {
    return this.routines.getScrollPosition(this.scrollable);
  }

  set scrollPosition(value: number) {
    const oldPosition = this.scrollPosition;
    this.logger.log(() => ['Setting scroll position at', value]);
    this.routines.setScrollPosition(this.scrollable, value);
    this.syntheticScrollTime = Number(Date.now());
    this.syntheticScrollPosition = this.scrollPosition;
    this.syntheticScrollDelta = this.syntheticScrollPosition - oldPosition;
  }

  getSize(): number {
    return this.routines.getSize(this.host);
  }

  getScrollableSize(): number {
    return this.routines.getSize(this.element);
  }

  getBufferPadding(): number {
    return this.getSize() * this.settings.padding;
  }

  getEdge(direction: Direction, opposite?: boolean): number {
    return this.routines.getEdge(this.host, direction, opposite);
  }

  getElementEdge(element: HTMLElement, direction: Direction, opposite?: boolean): number {
    return this.routines.getEdge(element, direction, opposite);
  }

  getLimit(direction: Direction, opposite?: boolean): number {
    return this.getEdge(direction, opposite) +
      (direction === (!opposite ? Direction.forward : Direction.backward) ? 1 : -1) * this.getBufferPadding();
  }

  getClipLimit(direction: Direction, clipPaddingDelta: number, opposite?: boolean): number {
    return this.getEdge(direction, opposite) +
      (direction === (!opposite ? Direction.forward : Direction.backward) ? 1 : -1) *
      (this.getBufferPadding() + clipPaddingDelta);
  }

  isElementVisible(element: HTMLElement): boolean {
    return this.getElementEdge(element, Direction.forward) > this.getEdge(Direction.backward);
  }

}
