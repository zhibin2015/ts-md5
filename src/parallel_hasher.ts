
export class ParallelHasher {
    private _queue = [];
    private _hashWorker;
    private _processing: { blob: any, resolve: any, reject: any };

    private _ready: boolean = true;
    private _window = (<any>window);


    constructor(workerUri: string) {
        var self = this;

        if (self._window.Worker) {
            self._hashWorker = new self._window.Worker(workerUri);
            self._hashWorker.onmessage = self._recievedMessage.bind(self);
            self._hashWorker.onerror = function (err) {
                self._ready = false;
                console.error('Hash worker failure', err);
            };
        } else {
            self._ready = false;
            console.error('Web Workers are not supported in this browser');
        }
    }


    hash(blob: any) {
        var self = this,
            promise;

        promise = new Promise((resolve, reject) => {
            self._queue.push({
                blob: blob,
                resolve: resolve,
                reject: reject
            });

            self._processNext();
        });

        return promise;
    }

    terminate() {
        this._ready = false;
        this._hashWorker.terminate();
    }


    // Processes the next item in the queue
    private _processNext() {
        if (this._ready && !this._processing && this._queue.length > 0) {
            this._processing = this._queue.pop();
            this._hashWorker.postMessage(this._processing.blob);
        }
    }

    // Hash result is returned from the worker
    private _recievedMessage(evt) {
        var data = evt.data;

        if (data.success) {
            this._processing.resolve(data.result);
        } else {
            this._processing.reject(data.result);
        }

        this._processing = null;
        this._processNext();
    }
}
