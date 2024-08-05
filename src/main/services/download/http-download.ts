import { DownloadItem } from "electron";
import { WindowManager } from "../window-manager";

export class HTTPDownload {
  private static id = 0;

  private static downloads: Record<string, DownloadItem> = {};

  public static getStatus(gid: string): {
    completedLength: number;
    totalLength: number;
    downloadSpeed: number;
  } | null {
    const downloadItem = this.downloads[gid];
    if (downloadItem) {
      return {
        completedLength: downloadItem.getReceivedBytes(),
        totalLength: downloadItem.getTotalBytes(),
        downloadSpeed: downloadItem.getCurrentBytesPerSecond(),
      };
    }

    return null;
  }

  static async cancelDownload(gid: string) {
    const downloadItem = this.downloads[gid];
    downloadItem?.cancel();
    delete this.downloads[gid];
  }

  static async pauseDownload(gid: string) {
    const downloadItem = this.downloads[gid];
    downloadItem?.pause();
  }

  static async resumeDownload(gid: string) {
    const downloadItem = this.downloads[gid];
    downloadItem?.resume();
  }

  static async startDownload(
    downloadPath: string,
    downloadUrl: string,
    headers?: Record<string, string>
  ) {
    return new Promise<string>((resolve) => {
      const options = headers ? { headers } : {};
      WindowManager.mainWindow?.webContents.downloadURL(downloadUrl, options);

      const gid = ++this.id;

      WindowManager.mainWindow?.webContents.session.on(
        "will-download",
        (_event, item, _webContents) => {
          this.downloads[gid.toString()] = item;

          // Set the save path, making Electron not to prompt a save dialog.
          item.setSavePath(downloadPath);

          resolve(gid.toString());
        }
      );
    });
  }
}
