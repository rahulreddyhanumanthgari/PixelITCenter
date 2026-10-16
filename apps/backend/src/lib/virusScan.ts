// Virus-scan hook for uploads. Called before a file is stored.
//
// TODO(virus-scan): wire a real scanner (ClamAV via clamd, or the object
// store's malware scanning) and return "INFECTED" to reject the upload.
// Until then every file is recorded with scanStatus "SKIPPED".

export type ScanResult = "CLEAN" | "INFECTED" | "SKIPPED";

export type VirusScanner = (data: Buffer) => Promise<ScanResult>;

export const skipScan: VirusScanner = async () => "SKIPPED";
