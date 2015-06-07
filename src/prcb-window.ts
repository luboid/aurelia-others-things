import {CompositionEngine, Aurelia, ViewSlot} from 'aurelia-framework';
import {inject} from 'aurelia-dependency-injection';
import * as $ from "jquery.prcb";

export interface IWindow {
  promise: Promise<string|any>,
  close: (result?:any) => Promise<any>;
  dismiss: (result?:string) => Promise<any>;
}

@inject(Aurelia, CompositionEngine)
export class PrcbWindow {
    private windows: Map<any, any> = new Map<any, any>();

    constructor(private aurelia: Aurelia, private compositionEngine: CompositionEngine) {
    }

    isDialog(viewModel: any) {
        return this.windows.has(viewModel);
    }

    close(viewModel: any, result?: any) {
        let windowClose = this.windows.get(viewModel);
        if (windowClose) {
            return windowClose.close(result);
        }
        else {
            this.windows.delete(viewModel);
            return Promise.resolve();
        }
    }

    dismiss(viewModel: any, result?: string) {
        let windowClose = this.windows.get(viewModel);
        if (windowClose) {
            return windowClose.dismiss(result);
        }
        else {
            this.windows.delete(viewModel);
            return Promise.resolve();
        }
    }

    show(instruction: string|any, dialogSettings?: any): IWindow {
        if (typeof instruction === 'string') {
            instruction = {
                viewModel: instruction
            };
        }

        let $viewSlot = $(document.createElement('div')).hide();

        let localInstruction = Object.assign({}, instruction, {
            container: this.aurelia.container,
            childContainer: this.aurelia.container.createChild(),
            viewSlot: new ViewSlot($viewSlot[0], true)
            //executionContext: this.aurelia.root.executionContext,
            //host: $viewSlot[0]
        });

        let canDeactivate = (viewModel) => {
            //Return a boolean value, a promise for a boolean value, or a navigation command.
            if (typeof viewModel.canDeactivate !== 'function') {
                return Promise.resolve();
            }

            let result = viewModel.canDeactivate();
            if (typeof result === 'boolean') {
                return result ? Promise.resolve() : Promise.reject(new Error('ViewModel can\'t be deactivated.'));
            }
            else {
                if (result.then) {
                    return result;
                }
                else {
                    // TODO router command, not implemented yet.
                    return Promise.reject(new Error('TODO router command, not implemented yet.'));
                }
            }
        }

        let destroy = (prcbWindow: boolean = false) => {
            this.windows.delete(localInstruction.viewModel);
            if (localInstruction.currentBehavior) {
                localInstruction.currentBehavior.detached();
                localInstruction.currentBehavior.unbind();
            }
            if (prcbWindow) {
                $viewSlot.prcbWindow('destroy');
            }
            $viewSlot.remove();
            window.setTimeout(function (viewModel) {
                // You can optionally return a promise to tell the router to wait until after your finish your work.
                if (typeof viewModel.deactivate === 'function') {
                  viewModel.deactivate();
                }
            }, 0, localInstruction.viewModel);
        };

        let loadAndBindPromise = this.compositionEngine.createViewModel(localInstruction)
          .then((localInstruction) => {
            // canActivate
            // ???? Why ... can be only activate, but if we want to load common ViewModel which is also loaded by router this is ...
            // Return a boolean value, a promise for a boolean value, or a navigation command.
            if (localInstruction.skipActivation || typeof localInstruction.viewModel.canActivate !== 'function') {
                return Promise.resolve(localInstruction);
            }

            return localInstruction.viewModel.canActivate(localInstruction.model).then(() => {
                return localInstruction;
            }) || Promise.resolve(localInstruction);
          })
          .then((localInstruction) => {
            return this.compositionEngine.createBehaviorAndSwap(localInstruction);
          })
          .then((behavior) => {
            localInstruction.currentBehavior = behavior;
            return localInstruction;
          });

        return {
            promise: new Promise((resolve, reject) => {
              loadAndBindPromise.then((localInstruction) => {
                // close handler
                let close = (result) => {
                    return canDeactivate(localInstruction.viewModel)
                        .then(() => {
                          $viewSlot.prcbWindow('destroy');
                          resolve(result);
                        });
                };

                let dismiss = (result) => {
                    return canDeactivate(localInstruction.viewModel)
                        .then(() => {
                          $viewSlot.prcbWindow('destroy');
                          reject(result);
                        });
                };

                // viewModel close handler
                this.windows.set(localInstruction.viewModel, {
                    close: close,
                    dismiss: dismiss
                });

                // Window settings
                let settings = Object.assign({
                    title: localInstruction.viewModel.title,
                    open: function () {
                        localInstruction.currentBehavior.view.attached();
                    },
                    close: function (event) {
                        let reason = this.closeReason();
                        if ('destroy' !== reason) {
                            event.preventDefault();
                            dismiss(reason);
                        }
                    },
                    destroy: () => {
                        destroy();
                    }
                }, dialogSettings);

                //open window
                $viewSlot.prcbWindow(settings);
              }, (error) => {
                destroy(true);
                reject(error);
              })
            }),
            close: (result) => {
                return this.close(localInstruction.viewModel, result);
            },
            dismiss: (result) => {
                return this.dismiss(localInstruction.viewModel, result);
            }
        };

    }
}
