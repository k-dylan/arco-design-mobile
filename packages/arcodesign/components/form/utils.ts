import { IRules, ValidatorError, isArray, isObject } from '@arco-design/mobile-utils';
import cloneDeepWith from 'lodash/cloneDeepWith';
export const isFieldRequired = (rules: IRules[] = []) => {
    return (rules || []).some(rule => rule?.required);
};

export const getErrorAndWarnings = (result: ValidatorError[]) => {
    let errors: string[] = [];
    let warnings: string[] = [];
    let errorTypes: string[] = [];
    result.map(({ message = [], validateLevel = 'error', errorTypes: resultErrorTypes }) => {
        if (!message?.length) {
            return;
        }
        if (validateLevel === 'warning') {
            warnings = [...warnings, ...message];
        } else {
            errors = [...errors, ...message];
            errorTypes = [...errorTypes, ...resultErrorTypes];
        }
    });
    return { warnings, errors, errorTypes };
};

export function deepClone(value) {
    return cloneDeepWith(value, (val) => {
      if (!isObject(val) && !isArray(val)) {
        return val;
      }
    });
  }
