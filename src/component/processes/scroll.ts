import { Scroller } from '../scroller';
import { Direction, Process, ProcessStatus, ScrollEventData } from '../interfaces/index';

enum ScrollProcess {
  stop = -1,
  start = 0,
  synth = 1,
  inertia = 2,
  delay = 3,
  run = 4
}

export default class Scroll {

  static run(scroller: Scroller, event?: Event) {
    const { syntheticScroll: synth, scrollState } = scroller.state;
    const position = scroller.viewport.scrollPosition;
    const time = Number(new Date());
    const direction = position === scrollState.position ? scrollState.direction :
      (position > scrollState.position ? Direction.forward : Direction.backward);
    const data = <ScrollEventData>{ position, time, direction };

    scroller.logger.log(() => [
      direction === Direction.backward ? '\u2934' : '\u2935',
      position, (time - scrollState.time) + 'ms',
      ...(synth.position === position ? ['- done synthetic'] : [])
    ]);

    let next = Scroll.processSyntheticScroll(scroller, data);

    if (!synth.isSet || synth.position !== position) {
      scrollState.setData(data);
    }

    if (next === ScrollProcess.inertia) {
      next = this.processInertiaScroll(scroller, data);
    }

    if (next === ScrollProcess.delay) {
      this.delayScroll(scroller);
    }
  }

  static processSyntheticScroll(
    scroller: Scroller, { position, time }: ScrollEventData
  ): ScrollProcess {
    const { syntheticScroll: synth, scrollState } = scroller.state;

    if (synth.isSet) {
      scroller.state.logSynth();
    }

    // H1 -- no synthetic position changes
    if (!synth.isSet) {
      return ScrollProcess.delay;
    }

    // H2 -- too much time have passed since last synthetic position change
    if (time - <number>synth.time > scroller.settings.maxSynthScrollDelay) {
      synth.reset();
      scroller.logger.log('reset synthetic by time');
      if (synth.position === position) { // do we need this branch?
        return ScrollProcess.stop;
      } else {
        return ScrollProcess.delay;
      }
    }

    // H3 -- this event is handling the exact last synthetic position change
    if (synth.position === position) {
      if (!synth.isDone && synth.handledPosition === position) {
        synth.reset();
        scroller.logger.log('reset synthetic by position');
      } else {
        if (synth.isDone) {
          scrollState.position = <number>synth.handledPosition;
          scrollState.time = <number>synth.handledTime;
        }
        synth.done();
        scroller.state.logSynth();
      }
      return ScrollProcess.stop;
    }

    // H4 -- here we have inertia over synthetic position change
    return ScrollProcess.inertia;
  }

  static processInertiaScroll(
    scroller: Scroller, { position, time, direction }: ScrollEventData
  ): ScrollProcess {
    const { viewport, logger, state: { syntheticScroll: synth } } = scroller;
    const nearest = synth.nearest(position);
    if (nearest === null) {
      logger.log('skip, no inertia');
      return ScrollProcess.delay;
    }

    const inc = direction === Direction.forward ? -1 : 1;
    const delta = position - <number>synth.position;
    const delay = time - <number>synth.time;
    const inertiaDelta = position - nearest.position;
    const inertiaDelay = time - nearest.time;
    const newPosition = <number>synth.position + inertiaDelta;

    logger.log(() => Scroll.logInertia(
      position, synth.position, nearest.position, delta, inertiaDelta, delay, inertiaDelay, newPosition
    ));

    // current inertia does continue last synthetic position
    if (inertiaDelta === delta) {
      synth.reset();
      logger.log('skip, proper inertia');
      return ScrollProcess.delay;
    }

    // if ( // precise inertia settings
    //   settings.inertia &&
    //   // -inertiaDelta > settings.inertiaScrollDelta &&
    //   inertiaDelay > settings.inertiaScrollDelay
    // ) {
    //   synth.reset();
    //   logger.log('skip, out of settings');
    //   return true;
    // }

    viewport.scrollPosition = newPosition;
    return ScrollProcess.stop;
  }

  static delayScroll(scroller: Scroller) {
    const { workflowOptions, scrollState: state } = scroller.state;
    if (!scroller.settings.throttle || workflowOptions.byTimer) {
      Scroll.doScroll(scroller);
      return;
    }
    const time = Number(Date.now());
    const tDiff = state.lastScrollTime + scroller.settings.throttle - time;
    const dDiff = scroller.settings.throttle + (state.firstScrollTime ? state.firstScrollTime - time : 0);
    const diff = Math.max(tDiff, dDiff);
    // scroller.logger.log('tDiff:', tDiff, 'dDiff:', dDiff, 'diff:', diff);
    if (diff <= 0) {
      scroller.purgeScrollTimers(true);
      state.lastScrollTime = time;
      state.firstScrollTime = 0;
      Scroll.doScroll(scroller);
    } else if (!state.scrollTimer && !state.keepScroll) {
      scroller.logger.log(() => `setting the timer at ${scroller.state.time + diff}`);
      state.firstScrollTime = time;
      state.scrollTimer = <any>setTimeout(() => {
        state.scrollTimer = null;
        scroller.logger.log(() => `fire the timer (${scroller.state.time})`);
        workflowOptions.byTimer = true;
        Scroll.run(scroller);
      }, diff);
    }
    // else {
    //   scroller.logger.log('MISS TIMER');
    // }
  }

  static logInertia(...args: any) {
    const list = [
      'position',
      'synthetic',
      'nearest',
      'delta synth',
      'delta inertia',
      'delay synth',
      'delay inertia',
      'new position'
    ];
    return 'inertia scroll; ' +
      list.reduce((acc: any[], str, ind) => [...acc, `${str}: ${args[ind]}`], []).join(', ');
  }

  static logPendingWorkflow(scroller: Scroller) {
    scroller.logger.log(() =>
      !scroller.state.scrollState.keepScroll ? [
        `setting %ckeepScroll%c flag (scrolling while the Workflow is pending)`,
        'color: #006600;', 'color: #000000;'
      ] : undefined);
  }

  static doScroll(scroller: Scroller) {
    const { state, state: { scrollState, workflowOptions } } = scroller;
    if (state.workflowPending) {
      Scroll.logPendingWorkflow(scroller);
      scrollState.keepScroll = true;
      return;
    }
    workflowOptions.scroll = true;
    workflowOptions.keepScroll = scrollState.keepScroll;
    scroller.callWorkflow({
      process: Process.scroll,
      status: ProcessStatus.next
    });
  }

}
