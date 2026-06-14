/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Disposable, Event, EventEmitter } from "vscode"

export interface PromiseAdapter<T, U> {
  (
    value: T,
    resolve: (value: U | PromiseLike<U>) => void,
    reject: (reason: unknown) => void,
  ): unknown
}

function passthrough<T>(value: T, resolve: (value: T | PromiseLike<T>) => void): void {
  resolve(value)
}

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
