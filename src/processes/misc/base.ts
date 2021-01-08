import { AdapterProcess, ProcessStatus } from './enums';
import { Scroller } from '../../scroller';
import { ADAPTER_METHODS, validate } from '../../inputs/index';
import { Process, IValidatedData } from '../../interfaces/index';

export interface IParseInput<T> {
  data: IValidatedData;
  params?: T;
}

export const getBaseProcess = (process: Process) =>

  class BaseAdapterProcess {

    static process: Process = process;

  };

export const getBaseAdapterProcess = (process: AdapterProcess) =>

  class BaseAdapterProcess extends getBaseProcess(process) {

    static process: AdapterProcess = process;

    static parseInput<T>(scroller: Scroller, options: T, ignoreErrors = false): IParseInput<T> {
      const result: IParseInput<T> = {
        data: validate(options, ADAPTER_METHODS[process])
      };

      if (result.data.isValid) {
        result.params = Object.entries(result.data.params)
          .reduce((acc, [key, { value }]) => ({
            ...acc,
            [key]: value
          }), {} as T);
      } else {
        scroller.logger.log(() => result.data.showErrors());
        if (!ignoreErrors) {
          scroller.workflow.call({
            process,
            status: ProcessStatus.error,
            payload: { error: `Wrong argument of the "${process}" method call` }
          });
        }
      }

      return result;
    }

  };
