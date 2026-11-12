import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileReturnPath} from '../src/lib/server/school/return-to-file.ts';

test('download login return preserves the file and child, including encoded IDs',()=>{
 assert.equal(fileReturnPath('/api/school/files/pack:autumn:lesson-1:handout'),'/api/school/files/pack:autumn:lesson-1:handout');
 assert.equal(fileReturnPath('/api/school/files/pack%3Aautumn%3Alesson-1%3Ahandout?child=student'),'/api/school/files/pack:autumn:lesson-1:handout?child=student');
 assert.equal(fileReturnPath('/api/school/files/E3dc63480b260?unused=value'),'/api/school/files/E3dc63480b260');
});

test('download return never accepts another origin, page, unsafe ID or child',()=>{
 for(const value of [null,'https://other.test/api/school/files/id','//other.test/api/school/files/id','/staff','/api/school/files/../../staff','/api/school/files/%2e%2e%2fstaff','/api/school/files/id#fragment','/api/school/files/%ZZ','/api/school/files/id?child=../someone','/api/school/files/id\n','/api/school/files/id/extra'])assert.equal(fileReturnPath(value),null,String(value));
});
