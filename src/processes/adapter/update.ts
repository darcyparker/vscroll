import { Scroller } from '../../scroller';
import { BaseAdapterProcessFactory, AdapterProcess, ProcessStatus } from '../misc/index';
import { Item } from '../../classes/item';
import { Direction } from '../../inputs/index';
import { AdapterUpdateOptions } from '../../interfaces/index';

export default class Update extends BaseAdapterProcessFactory(AdapterProcess.update) {

  static run(scroller: Scroller, options: AdapterUpdateOptions): void {
    const { params } = Update.parseInput(scroller, options);
    if (!params) {
      return;
    }

    const shouldUpdate = Update.doUpdate(scroller, params);

    scroller.workflow.call({
      process: Update.process,
      status: shouldUpdate ? ProcessStatus.next : ProcessStatus.done
    });
  }

  static doUpdate(scroller: Scroller, params: AdapterUpdateOptions): boolean {
    const { buffer, viewport, state: { fetch }, routines, logger } = scroller;
    if (!buffer.items) {
      logger.log(() => 'no items in Buffer');
      return false;
    }
    const before = [...buffer.items];
    const { item: firstItem, index: firstIndex, diff: firstItemDiff } =
      viewport.getEdgeVisibleItem(buffer.items, Direction.backward);

    const trackedIndex = buffer.updateItems(
      params.predicate,
      (index, data) => new Item(index, data, routines),
      firstIndex,
      !!params.fixRight
    );

    let delta = 0;
    const trackedItem = buffer.get(trackedIndex);
    if (firstItem && firstItem === trackedItem) {
      delta = - buffer.getSizeByIndex(trackedIndex) + firstItemDiff;
    }

    const itemsToRemove = before.filter(({ toRemove }) => toRemove);
    itemsToRemove.forEach(item => item.hide());
    logger.log(() => itemsToRemove.length
      ? 'items to remove: [' + itemsToRemove.map(({ $index }) => $index).join(',') + ']'
      : 'no items to remove'
    );

    const itemsToRender = buffer.items.filter(({ element }) => !element);
    logger.log(() => itemsToRender.length
      ? 'items to render: [' + itemsToRender.map(({ $index }) => $index).join(',') + ']'
      : 'no items to render'
    );

    fetch.update(trackedIndex, delta, itemsToRender, itemsToRemove);
    return !!itemsToRemove.length || !!itemsToRender.length;
  }

}
