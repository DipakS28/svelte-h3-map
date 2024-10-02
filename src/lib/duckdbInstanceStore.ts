import { get, writable } from 'svelte/store';

import * as duckdb from '@duckdb/duckdb-wasm';

import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

interface IDuckDbInstance {
	bundle: null | duckdb.DuckDBBundle;
	db: null | duckdb.AsyncDuckDB;
	isInstantiated: boolean;
	worker: null | Worker;
	logger: null | duckdb.ConsoleLogger;
}

function createDuckDbInstance() {
	const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
		mvp: {
			mainModule: duckdb_wasm,
			mainWorker: mvp_worker
		},
		eh: {
			mainModule: duckdb_wasm_eh,
			mainWorker: eh_worker
		}
	};
	const initialState: IDuckDbInstance = {
		bundle: null,
		db: null,
		worker: null,
		logger: null,
		isInstantiated: false
	};
	const store = writable(initialState);
    const  {subscribe, set, update } = store;

    let db : duckdb.AsyncDuckDB;
	//Select a bundle based on browser checks
	duckdb.selectBundle(MANUAL_BUNDLES).then((b) => {
		// Instantiate the asynchronus version of DuckDB-wasm
		const worker = new Worker(b.mainWorker!);
		const logger = new duckdb.ConsoleLogger();
		db = new duckdb.AsyncDuckDB(logger, worker);
		db.instantiate(b.mainModule, b.pthreadWorker).then(() => {
			set({
				bundle: b,
				db,
				worker,
				logger,
				isInstantiated: true
			});
		});
	});

    async function connect(){
        const instance = get(store);
        if(instance.isInstantiated){
            const conn = await instance.db?.connect();
            return conn
        } else {
            throw new Error("Error: DB has not yet been instantiated.")
        }
    }

    return {
        subscribe,
        set,
        update,
        connect,
    }
}

export const duckDbInstance = createDuckDbInstance(); 
