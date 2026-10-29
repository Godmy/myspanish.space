-- Only untouched builtin placeholders; these levels/formats have not been confirmed.
UPDATE school.courses SET level='', format='Уточняется' WHERE id IN ('phonetics','songs','with-mum','themes','marathons') AND version=1 AND demo=0;
INSERT INTO schema_migrations VALUES(4,datetime('now'));
