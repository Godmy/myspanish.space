import type { SQLInputValue } from 'node:sqlite';
import type { Row } from './types.ts';

export interface SchoolFiles {
 read(path:string):Uint8Array;
 write(path:string,value:Uint8Array):void;
 mkdir(path:string):void;
}
export interface SchoolStore {
 directory:string;
 files:SchoolFiles;
 all(sql:string,...values:SQLInputValue[]):Row[];
 one(sql:string,...values:SQLInputValue[]):Row|undefined;
 run(sql:string,...values:SQLInputValue[]):{changes:number|bigint;lastInsertRowid?:number|bigint};
 transaction<T>(callback:()=>T):T;
}
