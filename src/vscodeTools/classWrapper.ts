import { ProgressLocation, window } from "vscode";

export class VSCodeTools {
  singlePromiseWithProgress<T>(
    task: () => Promise<T>,
    progressTitle: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: progressTitle,
          cancellable: false,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
          });
          try {
            progress.report({
              increment: 0,
              message: `${progressTitle} started.`,
            });
            const result = await task();
            progress.report({
              increment: 100,
              message: `${progressTitle} completed.`,
            });
            resolve(result);
          } catch (error) {
            progress.report({
              increment: 100,
              message: `${progressTitle} failed.`,
            });
            reject(error);
          }
        }
      );
    });
  }
}
