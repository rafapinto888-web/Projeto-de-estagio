-- Executar na base existente antes de correr o backend com o novo modelo.
-- Preenche criado_em a partir da última marcação conhecida (legado).

ALTER TABLE dispositivos_descobertos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP NULL;

UPDATE dispositivos_descobertos
SET criado_em = ultima_vez_ativo_em
WHERE criado_em IS NULL AND ultima_vez_ativo_em IS NOT NULL;
