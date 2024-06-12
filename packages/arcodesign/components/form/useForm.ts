/* eslint-disable no-console */
import { ReactNode, useRef } from 'react';
import { Promise } from 'es6-promise';
import {
    Callbacks,
    IFieldError,
    FieldItem,
    IFormInstance,
    ValueChangeType,
    FieldValue,
} from './type';
import { deepClone } from './utils';

const defaultFunc: any = () => {};

export const defaultFormDataMethods = {
    getFieldValue: name => name,
    getFieldsValue: _names => {
        return {};
    },
    getFieldError: _name => [],
    setFieldValue: (_name, _value) => {
        return true;
    },
    setFieldsValue: _values => {
        return true;
    },
    registerField: (_name, _self) => {
        return () => {};
    },
    resetFields: defaultFunc,
    validateFields: defaultFunc,
    submit: defaultFunc,

    getInternalHooks: () => {
        return {
            registerField: defaultFunc,
            setInitialValues: defaultFunc,
            setCallbacks: defaultFunc,
            setInitialValue: defaultFunc,
        };
    },
};

// 在field的静态的状态下设置
class FormData {
    private _formData: FieldItem = {}; // 数据源

    private _fieldsList = {}; // 字段列表

    private _initialValues: Record<string, unknown> = {}; // 初始值

    private _callbacks: Callbacks = {};

    setFieldsValue = (values: FieldItem, changeType?: ValueChangeType): boolean => {
        const oldValues: FieldItem = Object.keys(values).reduce(
            (acc, key) => ({
                ...acc,
                [key]: this.getFieldValue(key),
            }),
            {},
        );
        this._formData = { ...this._formData, ...values };
        const { onValuesChange } = this._callbacks;
        onValuesChange && onValuesChange(values, this.getFieldsValue());
        this.notifyField(values, oldValues, changeType);
        return true;
    };

    setFieldValue = (name: string, value: unknown): boolean => {
        const oldValues = { [name]: this.getFieldValue(name) };
        this._formData = { ...this._formData, [name]: value };
        const { onValuesChange } = this._callbacks;
        onValuesChange &&
            onValuesChange(
                {
                    [name]: value,
                },
                this.getFieldsValue(),
            );
        this.notifyField({ [name]: value }, oldValues);
        return true;
    };

    notifyField = (
        values: FieldItem,
        oldValues: FieldItem,
        changeType: ValueChangeType = ValueChangeType.Update,
    ): void => {
        Object.keys(values).map((fieldName: string) => {
            const fieldObj = this._fieldsList?.[fieldName] || null;
            if (fieldObj) {
                fieldObj.onValueChange(values[fieldName], oldValues[fieldName], {
                    changeType,
                });
            }
        });
    };

    getFieldsValue = (names?: string[]) => {
        if (names) {
            return names.map(name => this.getFieldValue(name));
        }
        return deepClone(this._formData);
    };

    getFieldValue = (name: string) => {
        return deepClone(this._formData?.[name]);
    };

    getFieldError = (name: string): ReactNode[] => {
        const field = this._fieldsList?.[name] || null;
        if (field) {
            return field.getFieldError();
        }
        return [];
    };

    getFieldsError = (names?: string[]): Record<string, ReactNode[]> => {
        const fields = names || Object.keys(this._fieldsList);
        return fields.reduce((pre: Record<string, ReactNode[]>, name) => {
            const theField = this._fieldsList?.[name];
            if (theField) {
                pre[name] = theField?.getFieldError();
            }
            return pre;
        }, {});
    };

    isFieldTouched = (name: string): boolean => {
        const field = this._fieldsList?.[name] || null;
        if (field) {
            return field.isFieldTouched();
        }
        return false;
    };

    registerField = (name: string, self: any) => {
        this._fieldsList[name] = self;
        const { initialValue } = (self as any).props;
        if (initialValue !== undefined && name) {
            this._initialValues = {
                ...this._initialValues,
                [name]: initialValue,
            };
            this.setFieldsValue({
                ...this._formData,
                [name]: initialValue,
            });
        }

        return () => {
            if (name in this._fieldsList) {
                delete this._fieldsList[name];
                delete this._formData[name];
            }
        };
    };

    setInitialValues = (initVal: FieldItem) => {
        this._initialValues = deepClone(initVal || {});
        this.setFieldsValue(initVal);
    };

    setInitialValue = (name: string, value: FieldValue) => {
        if (!name) {
            return;
        }
        this._initialValues[name] = value;
        this.setFieldValue(name, value);
    };

    resetFields = () => {
        const newData = { ...this._initialValues };
        Object.keys(this._fieldsList).forEach(fieldName => {
            newData[fieldName] = this._initialValues[fieldName];
        });
        this.setFieldsValue(newData, ValueChangeType.Reset);
    };

    validateFields = () => {
        const promiseList: Promise<IFieldError>[] = [];
        Object.values(this._fieldsList).forEach((entity: any) => {
            const promise = entity.validateField();
            promiseList.push(promise.then(errors => errors));
        });
        const summaryPromise: Promise<IFieldError[]> = new Promise((resolve, reject) => {
            Promise.all(promiseList).then(res => {
                const errorResults = res.filter(item => item?.errors?.length);

                if (errorResults.length) {
                    reject(errorResults);
                } else {
                    resolve(res);
                }
            });
        });
        return summaryPromise;
    };

    submit = () => {
        this.validateFields()
            .then(result => {
                const { onSubmit } = this._callbacks;
                onSubmit?.(this.getFieldsValue(), result);
            })
            .catch(e => {
                const { onSubmitFailed } = this._callbacks;
                if (!onSubmitFailed) {
                    return;
                }
                onSubmitFailed(this.getFieldsValue(), e);
            });
    };

    setCallbacks = (callbacks: Callbacks) => {
        this._callbacks = callbacks;
    };

    getMethods = () => {
        return {
            setFieldsValue: this.setFieldsValue,
            setFieldValue: this.setFieldValue,
            getFieldsValue: this.getFieldsValue,
            getFieldValue: this.getFieldValue,
            getFieldError: this.getFieldError,
            getFieldsError: this.getFieldsError,
            isFieldTouched: this.isFieldTouched,
            registerField: this.registerField,
            resetFields: this.resetFields,
            submit: this.submit,
            getInternalHooks: this.getInternalHooks,
            validateFields: this.validateFields,
        };
    };

    getInternalHooks = () => {
        return {
            registerField: this.registerField,
            setInitialValues: this.setInitialValues,
            setCallbacks: this.setCallbacks,
            setInitialValue: this.setInitialValue,
        };
    };
}

export default function useForm(form?: IFormInstance) {
    const formInstanceRef = useRef<IFormInstance>(defaultFormDataMethods);
    const isSingletonRef = useRef<boolean>(false);
    if (!isSingletonRef.current) {
        if (form) {
            formInstanceRef.current = form;
        } else {
            const formIns = new FormData();
            formInstanceRef.current = formIns.getMethods();
        }
        isSingletonRef.current = true;
    }
    return [formInstanceRef.current];
}
