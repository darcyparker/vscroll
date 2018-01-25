import { Workflow } from './workflow';

import ShouldFetch from './workflow/shouldFetch';
import Fetch from './workflow/fetch';
import ProcessFetch from './workflow/processFetch';
import Render from './workflow/render';
import AdjustFetch from './workflow/adjustFetch';

export class WorkflowRunner {

  static async run(workflow: Workflow) {

    ShouldFetch.run(workflow);
    await Fetch.run(workflow);
    ProcessFetch.run(workflow);
    await Render.run(workflow);
    AdjustFetch.run(workflow);

    // workflow.fail(false);
    workflow.done(true);
  }

}
