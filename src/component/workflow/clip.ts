import { Scroller } from '../scroller';
import { Direction } from '../interfaces/direction';

export default class Clip {

  static run(scroller: Scroller) {
    if (!scroller.clip.shouldClip) {
      return scroller;
    }
    // scroller.stat('start clip');
    Clip.runByDirection(Direction.forward, scroller);
    Clip.runByDirection(Direction.backward, scroller);
    Clip.processBuffer(scroller);
    scroller.bindData();
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        // scroller.stat('end clip');
        Clip.processClip(scroller);
        resolve(scroller);
      })
    );
  }

  static runByDirection(direction: Direction, scroller: Scroller) {
    if (!scroller.clip[direction].shouldClip) {
      return;
    }
    const opposite = direction === Direction.forward ? Direction.backward : Direction.forward;
    scroller.viewport.padding[opposite].size += scroller.clip[direction].size;
  }

  static processBuffer(scroller: Scroller) {
    scroller.buffer.items = scroller.buffer.items.filter(item => {
      if (item.toRemove) {
        scroller.buffer.cache.add(item);
        item.hide();
        return false;
      }
      return true;
    });
    if (!scroller.buffer.size) {
      scroller.clip.previous.set(scroller.direction);
    }
  }

  static processClip(scroller: Scroller) {
    if (!scroller.clip[Direction.backward].shouldClip) {
      scroller.buffer.bof = false;
    }
    if (!scroller.clip[Direction.forward].shouldClip) {
      scroller.buffer.eof = false;
    }
  }

}
