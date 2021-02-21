import { BaseProcessFactory, CommonProcess, ProcessStatus } from './misc/index';
import { Scroller } from '../scroller';
import { Item } from '../classes/item';

export default class Render extends BaseProcessFactory(CommonProcess.render) {

  static run(scroller: Scroller): void {
    const { workflow, state: { cycle, render, scrollState, clip }, viewport } = scroller;
    scroller.logger.stat('before new items render');
    if (scrollState.positionBeforeAsync === null) {
      scrollState.positionBeforeAsync = viewport.scrollPosition;
    }
    render.renderTimer = setTimeout(() => {
      render.renderTimer = null;
      if (Render.doRender(scroller)) {
        workflow.call({
          process: Render.process,
          status: render.noSize ? ProcessStatus.done : ProcessStatus.next,
          payload: {
            process: cycle.initiator,
            doClip: clip.simulate
          }
        });
      } else {
        workflow.call({
          process: Render.process,
          status: ProcessStatus.error,
          payload: { error: 'Can\'t associate item with element' }
        });
      }
    }, 0);
  }

  static doRender(scroller: Scroller): boolean {
    const { state: { fetch, render }, viewport, buffer, logger } = scroller;
    render.positionBefore = viewport.scrollPosition;
    if (!fetch.isCheck) {
      render.sizeBefore = viewport.getScrollableSize();
      if (
        fetch.items.map(item => Render.processElement(scroller, item)).some(x => !x)
      ) {
        return false;
      }
    }
    buffer.checkAverageSize();
    render.sizeAfter = viewport.getScrollableSize();
    logger.stat('after new items render');
    logger.log(() => render.noSize ? 'viewport size has not been changed' : void 0);
    return true;
  }

  static processElement(scroller: Scroller, item: Item): boolean {
    const { state: { fetch }, viewport, buffer } = scroller;
    const element = viewport.element.querySelector(`[data-sid="${item.nodeId}"]`);
    if (!element) {
      return false;
    }
    item.element = element as HTMLElement;
    item.element.style.left = '';
    item.element.style.top = '';
    item.element.style.position = '';
    item.invisible = false;
    item.setSize();
    buffer.cacheItem(item);
    if (item.$index < fetch.minIndex) {
      fetch.negativeSize += item.size;
    }
    return true;
  }

}
