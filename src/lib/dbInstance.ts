// import * as duckdb from '@duckdb/duckdb-wasm';
// import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
// import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm';
// const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
//     mvp: {
//         mainModule: duckdb_wasm,
//         mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).toString(),
//     },
//     eh: {
//         mainModule: duckdb_wasm_next,
//         mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).toString(),
//     },
// };
// // Select a bundle based on browser checks
// const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
// // Instantiate the asynchronus version of DuckDB-wasm
// const worker = new Worker(bundle.mainWorker!);
// const logger = new duckdb.ConsoleLogger();
// const db = new duckdb.AsyncDuckDB(logger, worker);
// await db.instantiate(bundle.mainModule, bundle.pthreadWorker);