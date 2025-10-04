import { KernelManager, ServerConnection } from "@jupyterlab/services";
import type { IKernelConnection } from "@jupyterlab/services/lib/kernel/kernel";

export class JupyterManager {
  private kernelManager: KernelManager;
  private kernel: IKernelConnection | null;

  constructor() {
    const serverSettings = ServerConnection.makeSettings({
      baseUrl: "http://localhost:8888",
      wsUrl: "ws://localhost:8888",
    });

    this.kernelManager = new KernelManager({ serverSettings });
    this.kernel = null;
  }

  async startKernel() {
    this.kernel = await this.kernelManager.startNew({ name: "python3" });
    this.kernel.statusChanged.connect((_, status) => {
      console.log("Kernel status:", status);
    });
  }

  async runCode(code: string) {
    if (!this.kernel) {
      throw new Error("Kernel not initialized, initialize it using JupyterManager.startKernel()");
    }

    const future = this.kernel.requestExecute({ code });

    return new Promise<string>((resolve, reject) => {
      future.onIOPub = (msg) => {
        console.log("message:", msg);

        switch (msg.header.msg_type) {
          case "stream": {
            const content = msg.content as { name: string; text: string };
            if (content.name === "stdout") {
              resolve(content.text);
            }
            break;
          }

          case "execute_result": {
            const content = msg.content as {
              data: { "text/plain"?: string };
            };
            if (content.data && content.data["text/plain"]) {
              resolve(content.data["text/plain"]);
            }
            break;
          }

          case "error": {
            const content = msg.content as {
              ename: string;
              evalue: string;
              traceback: string[];
            };
            reject(
              resolve(
                `${content.ename}: ${content.evalue}\n${content.traceback.join(
                  "\n"
                )}`
              )
            );
            break;
          }
        }
      };

      // also reject if execution future itself fails
      future.done.catch(reject);
    });
  }
}
