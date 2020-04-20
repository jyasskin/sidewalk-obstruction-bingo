import { DBSchema, openDB } from 'idb';
import { TileDetails } from "../components/gather-tile-details-modal";
import { TileInterface } from "./tiles";

interface ReportBase {
  /** Generated by pushid(). This makes it both probabilistically globally
   * unique and ascending by the time it was generated. */
  uuid: string;
  /** The time at which this report was queued. */
  addTime: Date;
  /** When the report last started being sent. If this is older than a
   * reasonable timeout, we should assume the send failed. */
  sending: Date | null;

  /** Most reports are that someone found an obstruction, but if they un-mark a
   * tile after that tile was reported, we report a 'Cancel' update to undo it. */
  type: 'Found' | 'Cancel';
}
interface FoundReport extends ReportBase {
  type: 'Found';
  /** Currently the alt text of the tile. This should probably be something
   * more stable. */
  tile: string;
  /** Extra information about this particular tile. */
  details: string;
  /** The name of a location, as opposed to a geolocation. Either this or
   * lat/long/accuracy will be set. */
  textLocation: string | "";
  latitude: number | null;
  longitude: number | null;
  /** As in the Geolocation interface, the 95% confidence radius in meters. */
  accuracy: number | null;
}
interface CancelReport extends ReportBase {
  type: 'Cancel';
  // Identifies the report to cancel with its uuid.
}

interface SobDB extends DBSchema {
  queuedReports: {
    key: string;
    value: FoundReport | CancelReport;
    indexes: {
      tile: string;
      addTime: Date;
    };
  };
}

// Only define this in the browser.
const sobDB = typeof window === 'undefined' ? undefined :
  openDB<SobDB>("sidewalk-obstruction-bingo", 1, {
    upgrade(db, oldVersion) {
      switch (oldVersion) {
        case 0: {
          const reportStore = db.createObjectStore('queuedReports', { keyPath: 'uuid' });
          reportStore.createIndex("tile", "tile");
          reportStore.createIndex("addTime", "addTime");
        }
      }
    },
    blocking() {
      // Everything should always be saved to IDB, and the system should only
      // notice that an upgrade is needed as another page is loaded, so we want to
      // get out of the way ASAP. Do that by immediately closing the database, and
      // then reload the page to get back in sync with the new code.
      sobDB.then(db => db.close());
      location.reload();
    },
  });

const reportAppScriptUrl =
  "https://script.google.com/macros/s/AKfycbwx-6aWGb_zojc9r-RGz84NGeTmWdv96ovuLOZQSNzRfyUxR2U/exec";

const productionSpreadsheet = "1oePSSxULfE4u1DZ2Gf91SkacNvYWXc_ZlbzEzntzlto";
const testSpreadsheet = "1ahxdRFPvX_aZd3O3lnzT36zNTWpj0ZMF6BqxWmKXYsA";
const currentSpreadsheet = ((): string => {
  if (typeof window === 'undefined') {
    return "";
  } else if (location.hostname.endsWith("localhost")) {
    return testSpreadsheet;
  } else {
    return productionSpreadsheet;
  }
})();

const sendReportsDelay = 60 * 1000;
const minReportAgeToSend = 10 * 1000;

let sendReportsTaskId = -1;

function scheduleSendReports(): void {
  if (sendReportsTaskId === -1) {
    sendReportsTaskId = window.setTimeout(async () => {
      sendReportsTaskId = -1;

      const now = new Date();
      const db = await sobDB;
      const tx1 = db.transaction('queuedReports', 'readwrite');
      const reports = await tx1.store.index('addTime')
        .getAll(IDBKeyRange.upperBound(new Date(now.getTime() - minReportAgeToSend)));

      // Mark all the reports as last-sent now.
      await Promise.all(reports.map(report => {
        report.sending = now;
        return tx1.store.put(report);
      }));
      const postBody = JSON.stringify(reports.map(({
        uuid, type, tile, details, textLocation, latitude, longitude, accuracy }:
        // The funny type here tells Typescript that I mean to read fields
        // that don't exist on all the possible input types. The rest will get
        // undefined, which is what I want in the output.
        FoundReport & CancelReport) =>
        ({ uuid, type, tile, details, textLocation, latitude, longitude, accuracy })));

      // Explicitly close the transaction before the fetch, so it's not
      // ambiguous whether it closes during the fetch.
      await tx1.done;

      const reportTarget = new URL(reportAppScriptUrl);
      reportTarget.searchParams.append("sheet", currentSpreadsheet);
      const req = new Request(reportTarget.href, {
        method: "POST",
        headers: new Headers({
          // Avoid a CORS preflight:
          'Content-Type': 'text/plain',
        }),
        body: postBody,
        credentials: "omit",
        referrerPolicy: "origin",
      });
      const response = await fetch(req);
      if (!response.ok) {
        console.error("Failed to send report:", response);
        return;
      }

      const { written, debugLog, error }: { written: string[]; debugLog: unknown[]; error: object } = await response.json();
      if (error) {
        console.error('Server error:', error);
      }
      if (debugLog) {
        console.log('Server debug log:', debugLog);
      }

      const tx2 = db.transaction('queuedReports', 'readwrite');
      await Promise.all(written.map(uuid => tx2.store.delete(uuid)));
      if ((await tx2.store.count()) > 0) {
        scheduleSendReports();
      }
      await tx2.done;
    }, sendReportsDelay);
  }
}

export async function queueReport(uuid: string, tile: TileInterface, { detailString, textLocation, location: { latitude, longitude, accuracy } }: TileDetails): Promise<string> {
  const db = await sobDB;
  const tx = db.transaction('queuedReports', 'readwrite');
  await tx.store.add({
    uuid,
    addTime: new Date(),
    sending: null,
    type: 'Found',
    tile: tile.alt,
    details: detailString,
    textLocation,
    latitude,
    longitude,
    accuracy,
  });
  await tx.done;
  scheduleSendReports();
  return uuid;
}

export async function tryUnqueueReport(uuid: string): Promise<void> {
  const db = await sobDB;
  const tx = db.transaction('queuedReports', 'readwrite');
  const lastMatchingReportCursor = await tx.store.openCursor(uuid);
  if (lastMatchingReportCursor === null || lastMatchingReportCursor.value.sending !== null) {
    // The 'Found' report was already sent, so add a 'Cancel' report.
    await tx.store.add({
      uuid,
      addTime: new Date(),
      sending: null,
      type: 'Cancel',
    });
    await tx.done;
    scheduleSendReports();
  } else {
    // We caught it in time and can just delete the report.
    await lastMatchingReportCursor.delete();
    await tx.done;
  }
}
