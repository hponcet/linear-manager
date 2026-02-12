/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* taken from https://github.com/microsoft/vscode/blob/559e9beea981b47ffd76d90158ccccafef663324/extensions/github-authentication/src/common/utils.ts#L50-L78 */
import { EventEmitter, Event, Disposable } from "vscode"

export interface PromiseAdapter<T, U> {
  (
    value: T,
    resolve: (value: U | PromiseLike<U>) => void,
    reject: (reason: unknown) => void,
  ): unknown
}

/**
 * Default passthrough adapter that resolves the promise with the emitted event value.
 */
function passthrough<T>(value: T, resolve: (value: T | PromiseLike<T>) => void): void {
  resolve(value)
}

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function that resolves with the event value.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export function promiseFromEvent<T, U = T>(
  event: Event<T>,
  adapter: PromiseAdapter<T, U> = passthrough as PromiseAdapter<T, U>,
): { promise: Promise<U>; cancel: EventEmitter<void> } {
  let subscription: Disposable
  const cancel = new EventEmitter<void>()
  return {
    promise: new Promise<U>((resolve, reject) => {
      cancel.event(() => reject(new Error("Cancelled")))
      subscription = event((value: T) => {
        try {
          Promise.resolve(adapter(value, resolve, reject)).catch(reject)
        } catch (error) {
          reject(error)
        }
      })
    }).then(
      (result: U) => {
        subscription.dispose()
        return result
      },
      (error: unknown) => {
        subscription.dispose()
        throw error
      },
    ),
    cancel,
  }
}
