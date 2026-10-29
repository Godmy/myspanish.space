// All data remains on the selected server. Reverse proxy / TLS is configured by the operator.
process.env.SCHOOL_STORAGE = 'sqlite';
process.env.SCHOOL_DATA_DIR ??= '.school-production';
process.env.BODY_SIZE_LIMIT ??= '12M';
process.env.HOST ??= '127.0.0.1';
await import('../../build-node/index.js');
