import BaseService from './BaseService';
import scgiUtil from '../util/scgiUtil';

class ClientRequestManager extends BaseService {
  isRequestPending = false;
  lastResponseTimestamp = 0;
  pendingRequests: Array<{
    methodName: string;
    parameters: Array<string | Array<{methodName: string; params: Array<string>}>>;
    resolve: (value?: unknown) => void;
    reject: () => void;
  }> = [];

  constructor(...args: ConstructorParameters<typeof BaseService>) {
    super(...args);

    this.sendDeferredMethodCall = this.sendDeferredMethodCall.bind(this);
    this.sendMethodCall = this.sendMethodCall.bind(this);
    this.methodCall = this.methodCall.bind(this);
  }

  handleRequestEnd() {
    this.isRequestPending = false;

    // We avoid initiating any deffered requests until at least 250ms have
    // since the previous response.
    const currentTimestamp = Date.now();
    const timeSinceLastResponse = currentTimestamp - this.lastResponseTimestamp;

    if (timeSinceLastResponse <= 250) {
      const delay = 250 - timeSinceLastResponse;
      setTimeout(this.sendDeferredMethodCall, delay);
      this.lastResponseTimestamp = currentTimestamp + delay;
    } else {
      this.sendDeferredMethodCall();
      this.lastResponseTimestamp = currentTimestamp;
    }
  }

  sendDeferredMethodCall() {
    const nextRequest = this.pendingRequests.shift();
    if (nextRequest == null) {
      return;
    }

    this.isRequestPending = true;
    this.sendMethodCall(nextRequest.methodName, nextRequest.parameters)
      .then(nextRequest.resolve)
      .catch(nextRequest.reject);
  }

  sendMethodCall(methodName: string, parameters: Array<string | Array<{methodName: string; params: Array<string>}>>) {
    const connectionMethod = {
      host: this.user.host,
      port: this.user.port,
      socketPath: this.user.socketPath,
    };

    return scgiUtil
      .methodCall(connectionMethod, methodName, parameters)
      .then((response) => {
        this.handleRequestEnd();
        return response;
      })
      .catch((error) => {
        this.handleRequestEnd();
        throw error;
      });
  }

  methodCall(methodName: string, parameters: Array<string | Array<{methodName: string; params: Array<string>}>>) {
    // We only allow one request at a time.
    if (this.isRequestPending) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({
          methodName,
          parameters,
          resolve,
          reject,
        });
      });
    }
    this.isRequestPending = true;
    return this.sendMethodCall(methodName, parameters);
  }
}

export default ClientRequestManager;