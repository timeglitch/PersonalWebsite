/**
 * The microfiche viewer's public surface.
 *
 * Everything else in this folder — the cells, the sheet geometry, the transport
 * audio — is internal to the viewer. Import from here rather than reaching in.
 */
export { default as MicroficheViewer } from "./MicroficheViewer";
export { clusters } from "./sheetData";
export type { Cluster } from "./sheetData";
