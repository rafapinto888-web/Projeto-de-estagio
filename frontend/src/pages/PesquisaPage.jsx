/* Pesquisa global - layout aproximado da referencia visual. */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SectionCard from "../components/SectionCard";

function tituloSecao(chave) {
  return String(chave || "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

const TIPOS_SUPORTADOS = [
  { value: "computadores", label: "Computadores" },
  { value: "inventarios", label: "Inventários" },
  { value: "utilizadores", label: "Utilizadores" },
  { value: "localizacoes", label: "Localizações" },
];

function parseOutput(raw) {
  if (!raw || !String(raw).trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toSections(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return [{ key: "resultados", value: parsed }];
  if (typeof parsed === "object") return Object.entries(parsed).map(([key, value]) => ({ key, value }));
  return [{ key: "resultado", value: parsed }];
}

function secaoVisual(secao) {
  const key = String(secao || "").toLowerCase();
  if (key.includes("invent")) return { icon: "inventory_2", label: "Inventários", tone: "green" };
  if (key.includes("utiliz") || key.includes("user")) return { icon: "group", label: "Utilizadores", tone: "purple" };
  if (key.includes("local")) return { icon: "location_on", label: "Localizações", tone: "amber" };
  if (key.includes("comput") || key.includes("ativo") || key.includes("dispositivo")) {
    return { icon: "computer", label: "Ativos encontrados", tone: "blue" };
  }
  return { icon: "list_alt", label: tituloSecao(secao), tone: "slate" };
}

function secaoAccent(secao) {
  const tone = secaoVisual(secao).tone;
  if (tone === "blue") return { bg: "#eff6ff", border: "#2563eb", icon: "#1d4ed8" };
  if (tone === "green") return { bg: "#ecfdf5", border: "#16a34a", icon: "#15803d" };
  if (tone === "purple") return { bg: "#f5f3ff", border: "#7c3aed", icon: "#6d28d9" };
  if (tone === "amber") return { bg: "#fffbeb", border: "#d97706", icon: "#b45309" };
  return { bg: "#f8fafc", border: "#64748b", icon: "#475569" };
}

function valorHumano(v) {
  if (v == null || String(v).trim() === "") return "—";
  return String(v);
}

function normalizarTexto(v) {
  return String(v == null ? "" : v)
    .trim()
    .toLowerCase();
}

function estadoChipColor(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("ativo") || e.includes("conclu")) return "success";
  if (e.includes("manut") || e.includes("pend")) return "warning";
  if (e.includes("inativ") || e.includes("erro")) return "error";
  return "default";
}

function itemCorrespondeTermo(item, termoNormalizado) {
  if (!termoNormalizado) return true;
  const texto = [
    item?.nome,
    item?.hostname,
    item?.email,
    item?.descricao,
    item?.numero_serie,
    item?.ip,
    item?.endereco_ip,
    item?.estado,
    item?.localizacao_nome,
    item?.utilizador_responsavel_nome,
    item?.utilizador_nome,
    item?.inventario_nome,
    item?.sistema_operativo,
    item?.marca,
    item?.modelo,
  ]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" ")
    .toLowerCase();
  return texto.includes(termoNormalizado);
}

function normalizarLinha(row) {
  const item = row.item || {};
  const nome = item.nome || item.hostname || item.email || item.descricao || "—";
  const desc = item.descricao || item.sistema_operativo || item.modelo || "";
  const detalhes = [
    item.numero_serie ? `SN: ${item.numero_serie}` : null,
    item.ip || item.endereco_ip ? `IP: ${item.ip || item.endereco_ip}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return {
    ...row,
    nome,
    desc,
    detalhes,
    localizacao: item.localizacao_nome || item.localizacao || "",
    utilizador: item.utilizador_nome || item.utilizador_responsavel_nome || item.username || item.email || "",
    estado: item.estado || "",
  };
}

export default function PesquisaPage({
  globalTermo,
  setGlobalTermo,
  onPesquisar,
  globalOutput,
  loading,
  searchRequestId,
  localizacoesBase = [],
  computadoresBase = [],
  inventariosBase = [],
  utilizadoresBase = [],
  ativosPorInventarioBase = [],
}) {
  const [filtroSecao, setFiltroSecao] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroLocalizacao, setFiltroLocalizacao] = useState("todas");
  const [aba, setAba] = useState("resultados");
  const [ordem, setOrdem] = useState("relevancia");
  const [mostrarAvancados, setMostrarAvancados] = useState(false);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const parsed = useMemo(() => parseOutput(globalOutput), [globalOutput]);
  const dispositivosDescobertosBase = useMemo(() => {
    return (ativosPorInventarioBase || []).flatMap((grupo) =>
      (grupo?.ativos || [])
        .filter((a) => a?.tipo === "dispositivo_descoberto")
        .map((a) => ({
          ...a,
          nome: a?.nome || a?.hostname || a?.ip || `Dispositivo ${a?.id ?? ""}`.trim(),
          endereco_ip: a?.endereco_ip || a?.ip || null,
          inventario_nome: grupo?.inventario_nome || null,
        })),
    );
  }, [ativosPorInventarioBase]);

  const termoNormalizado = useMemo(() => normalizarTexto(globalTermo), [globalTermo]);
  const scansFiltradosPorTermo = useMemo(
    () => dispositivosDescobertosBase.filter((item) => itemCorrespondeTermo(item, termoNormalizado)),
    [dispositivosDescobertosBase, termoNormalizado],
  );

  const computadoresComScansBase = useMemo(
    () => [...(computadoresBase || []), ...dispositivosDescobertosBase],
    [computadoresBase, dispositivosDescobertosBase],
  );

  const secoesBase = useMemo(
    () => [
      { key: "computadores", value: computadoresComScansBase || [] },
      { key: "inventarios", value: inventariosBase || [] },
      { key: "utilizadores", value: utilizadoresBase || [] },
      { key: "localizacoes", value: localizacoesBase || [] },
    ],
    [computadoresComScansBase, inventariosBase, utilizadoresBase, localizacoesBase],
  );
  const secoes = useMemo(() => {
    const fromSearch = toSections(parsed);
    const temResultadoPesquisa = fromSearch.some((s) => Array.isArray(s.value) && s.value.length > 0);
    if (!temResultadoPesquisa) return secoesBase;

    if (scansFiltradosPorTermo.length === 0) return fromSearch;

    let encontrouSecaoComputadores = false;
    const merged = fromSearch.map((secao) => {
      if (secao.key !== "computadores") return secao;
      encontrouSecaoComputadores = true;
      const lista = Array.isArray(secao.value) ? secao.value : [secao.value];
      return { ...secao, value: [...lista, ...scansFiltradosPorTermo] };
    });

    if (!encontrouSecaoComputadores) {
      merged.unshift({ key: "computadores", value: scansFiltradosPorTermo });
    }

    return merged;
  }, [parsed, secoesBase, scansFiltradosPorTermo]);

  const rowsBase = useMemo(() => {
    return secoes.flatMap(({ key, value }) => {
      const lista = Array.isArray(value) ? value : [value];
      return lista.map((item, idx) => normalizarLinha({ key: `${key}-${idx}`, secao: key, item }));
    });
  }, [secoes]);

  const opcoesTipo = useMemo(() => {
    const extras = secoes
      .map((s) => s.key)
      .filter((k) => !TIPOS_SUPORTADOS.some((base) => base.value === k))
      .map((k) => ({ value: k, label: tituloSecao(k) }));
    return [...TIPOS_SUPORTADOS, ...extras];
  }, [secoes]);
  const opcoesLocalizacao = useMemo(() => {
    const mapa = new Map();

    (localizacoesBase || []).forEach((loc) => {
      const label = String(loc?.nome || "").trim();
      const value = normalizarTexto(label);
      if (!value) return;
      if (!mapa.has(value)) mapa.set(value, label);
    });

    rowsBase.forEach((r) => {
      const label = String(r.localizacao || "").trim();
      const value = normalizarTexto(label);
      if (!value) return;
      if (!mapa.has(value)) mapa.set(value, label);
    });

    return Array.from(mapa.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt"));
  }, [localizacoesBase, rowsBase]);

  const opcoesEstado = useMemo(() => {
    const mapa = new Map();

    (computadoresBase || []).forEach((pc) => {
      const label = String(pc?.estado || "").trim();
      const value = normalizarTexto(label);
      if (!value) return;
      if (!mapa.has(value)) mapa.set(value, label);
    });

    rowsBase.forEach((r) => {
      const label = String(r.estado || "").trim();
      const value = normalizarTexto(label);
      if (!value) return;
      if (!mapa.has(value)) mapa.set(value, label);
    });
    return Array.from(mapa.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt"));
  }, [computadoresBase, rowsBase]);

  const rowsFiltradas = useMemo(() => {
    return rowsBase.filter((r) => {
      if (filtroSecao !== "todas" && normalizarTexto(r.secao) !== normalizarTexto(filtroSecao)) return false;
      if (filtroEstado !== "todos" && normalizarTexto(r.estado) !== normalizarTexto(filtroEstado)) return false;
      if (filtroLocalizacao !== "todas" && normalizarTexto(r.localizacao) !== normalizarTexto(filtroLocalizacao)) return false;
      return true;
    });
  }, [rowsBase, filtroSecao, filtroEstado, filtroLocalizacao]);

  const rowsOrdenadas = useMemo(() => {
    if (ordem === "relevancia") return rowsFiltradas;
    return [...rowsFiltradas].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }, [rowsFiltradas, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(rowsOrdenadas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const rowsPaginadas = rowsOrdenadas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  useEffect(() => {
    setPagina(1);
  }, [filtroSecao, filtroEstado, filtroLocalizacao, ordem, globalOutput]);

  useEffect(() => {
    if (!searchRequestId) return;
    const termo = String(globalTermo || "").trim();
    if (!termo) return;
    onPesquisar?.();
  }, [searchRequestId, globalTermo, onPesquisar]);

  const cardsResumo = useMemo(() => {
    const by = new Map();
    rowsFiltradas.forEach((r) => by.set(r.secao, (by.get(r.secao) || 0) + 1));
    return Array.from(by.entries()).map(([secao, total]) => ({ secao, total }));
  }, [rowsFiltradas]);

  const semResultado = !loading && rowsBase.length === 0;
  const semResultadosFiltrados = !loading && !semResultado && rowsOrdenadas.length === 0;
  const erroMensagem =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed?.erro
      ? String(parsed.erro)
      : "";
  const totalResultados = rowsOrdenadas.length;

  async function handleSubmit(e) {
    e.preventDefault();
    const termo = String(globalTermo || "").trim();
    if (!termo || loading) return;
    await onPesquisar?.();
  }

  return (
    <SectionCard
      title="Pesquisa Global"
      subtitle="Encontra rapidamente ativos, inventários e utilizadores em todo o sistema."
      rightAction={
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={`${totalResultados} resultado(s)`}
          sx={{ bgcolor: "#f8fbff" }}
        />
      }
    >
      <Stack spacing={2.3}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
          <Paper
            component="form"
            onSubmit={handleSubmit}
            variant="outlined"
            sx={{
              flex: 1,
              p: 1.2,
              bgcolor: "#ffffff",
              borderColor: "#bfdbfe",
              borderWidth: 2,
              borderRadius: 3,
              boxShadow: "0 14px 30px rgba(37,99,235,0.12)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                value={globalTermo}
                onChange={(e) => setGlobalTermo(e.target.value)}
                placeholder="Ex.: dell latitude 5420"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#94a3b8" }}>
                        search
                      </span>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" size="small" sx={{ minWidth: 110 }} disabled={loading || !String(globalTermo || "").trim()}>
                {loading ? "A pesquisar..." : "Pesquisar"}
              </Button>
              <Button
                type="button"
                size="small"
                variant="outlined"
                sx={{ minWidth: 88 }}
                onClick={() => setGlobalTermo("")}
                disabled={loading}
              >
                Limpar
              </Button>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              minWidth: { lg: 320 },
              bgcolor: "#eff6ff",
              borderColor: "#bfdbfe",
              borderRadius: 3,
            }}
          >
            <Stack direction="row" spacing={1}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#2563eb", marginTop: 2 }}>
                tips_and_updates
              </span>
              <Box>
                <Typography fontSize={12} fontWeight={700}>
                  Dicas de pesquisa
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  Pesquisa por nome do ativo, IP, número de série, utilizador, inventário e localização.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 1.25,
            bgcolor: "#fcfdff",
            borderColor: "#bfdbfe",
            borderRadius: 3,
            boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ md: "flex-end" }}
            sx={{ "& .MuiFormControl-root": { minWidth: { md: 170 } } }}
          >
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <Typography fontSize={11} color="text.secondary" mb={0.4}>
                Tipo de entidade
              </Typography>
              <Select value={filtroSecao} onChange={(e) => setFiltroSecao(e.target.value)}>
                <MenuItem value="todas">Todos os tipos</MenuItem>
                {opcoesTipo.map((k) => (
                  <MenuItem key={k.value} value={k.value}>
                    {k.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <Typography fontSize={11} color="text.secondary" mb={0.4}>
                Localização
              </Typography>
              <Select value={filtroLocalizacao} onChange={(e) => setFiltroLocalizacao(e.target.value)}>
                <MenuItem value="todas">Todas as localizações</MenuItem>
                {opcoesLocalizacao.map((l) => (
                  <MenuItem key={l.value} value={l.value}>
                    {l.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <Typography fontSize={11} color="text.secondary" mb={0.4}>
                Estado
              </Typography>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <MenuItem value="todos">Todos (campos de estado)</MenuItem>
                {opcoesEstado.map((e) => (
                  <MenuItem key={e.value} value={e.value}>
                    {e.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="button" variant={mostrarAvancados ? "contained" : "outlined"} size="small" onClick={() => setMostrarAvancados((v) => !v)}>
              {mostrarAvancados ? "Ocultar avançados" : "Filtros avançados"}
            </Button>
          </Stack>
        </Paper>

        {mostrarAvancados ? (
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => {
                setFiltroSecao("todas");
                setFiltroEstado("todos");
                setFiltroLocalizacao("todas");
                setOrdem("relevancia");
              }}
            >
              Limpar filtros
            </Button>
          </Stack>
        ) : null}

        {loading ? (
          <div className="loading-box">A pesquisar…</div>
        ) : erroMensagem ? (
          <Paper variant="outlined" sx={{ p: 2, borderStyle: "dashed", bgcolor: "#fff1f2", borderColor: "#fecdd3" }}>
            <Stack direction="row" spacing={1}>
              <span className="material-symbols-outlined" style={{ color: "#e11d48" }}>
                error
              </span>
              <Box>
                <Typography fontSize={14} fontWeight={700}>
                  Erro na pesquisa
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {erroMensagem}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : semResultado ? (
          <Paper variant="outlined" sx={{ p: 2, borderStyle: "dashed", bgcolor: "#f8fafc" }}>
            <Stack direction="row" spacing={1}>
              <span className="material-symbols-outlined" style={{ color: "#94a3b8" }}>
                travel_explore
              </span>
              <Box>
                <Typography fontSize={14} fontWeight={700}>
                  Pronto para pesquisar
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  Introduz um termo e carrega em Pesquisar para ver resultados organizados por secção.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gap: 1.2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))" },
              }}
            >
              {cardsResumo.map((c) => (
                <Card
                  key={c.secao}
                  variant="outlined"
                  sx={{
                    p: 1.35,
                    borderColor: secaoAccent(c.secao).border,
                    bgcolor: secaoAccent(c.secao).bg,
                    borderLeft: `5px solid ${secaoAccent(c.secao).border}`,
                    boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
                  }}
                >
                  <Stack direction="row" spacing={1.1}>
                    <span className="material-symbols-outlined" style={{ color: secaoAccent(c.secao).icon, fontSize: 20 }}>
                      {secaoVisual(c.secao).icon}
                    </span>
                    <Box>
                      <Typography fontSize={22} lineHeight={1} fontWeight={800}>
                        {c.total}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {secaoVisual(c.secao).label}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Box>

            <Paper variant="outlined" sx={{ p: 1, borderRadius: 3, borderColor: "#dbe5f2", bgcolor: "#fff" }}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="space-between" alignItems={{ lg: "center" }}>
                <Tabs value={aba} onChange={(_, value) => setAba(value)} variant="scrollable" allowScrollButtonsMobile>
                  <Tab value="resultados" label="Resultados" />
                  <Tab value="agrupado" label="Agrupado por tipo" />
                </Tabs>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small">
                    <Select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
                      <MenuItem value="relevancia">Ordenar por Relevância</MenuItem>
                      <MenuItem value="nome">Nome (A-Z)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            {aba === "resultados" ? (
              <>
                {semResultadosFiltrados ? (
                  <Paper variant="outlined" sx={{ p: 2, borderStyle: "dashed", bgcolor: "#f8fafc" }}>
                    <Stack direction="row" spacing={1}>
                      <span className="material-symbols-outlined" style={{ color: "#94a3b8" }}>
                        filter_alt_off
                      </span>
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>
                          Sem resultados com os filtros atuais
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          Ajusta os filtros ou limpa para voltar a ver os dados.
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ) : null}
                <Typography fontSize={11} color="text.secondary" sx={{ px: 0.25 }}>
                  {rowsOrdenadas.length} resultado(s) encontrado(s)
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "#dbe5f2",
                    "& .MuiTableHead-root .MuiTableCell-root": {
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#e2e8f0",
                      bgcolor: "#0f172a",
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:hover": {
                      bgcolor: "#eff6ff",
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
                      bgcolor: "#fbfdff",
                    },
                    "& .MuiTableBody-root .MuiTableCell-root": {
                      py: 1.1,
                    },
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Nome / Descrição</TableCell>
                        <TableCell>Detalhes</TableCell>
                        <TableCell>Localização</TableCell>
                        <TableCell>Utilizador</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rowsPaginadas.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              {secaoVisual(r.secao).icon}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize={12.5} fontWeight={700}>
                              {r.nome}
                            </Typography>
                            <Typography fontSize={11} color="text.secondary">
                              {r.desc || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>{r.detalhes || "—"}</TableCell>
                          <TableCell>{valorHumano(r.localizacao)}</TableCell>
                          <TableCell>{valorHumano(r.utilizador)}</TableCell>
                          <TableCell>
                            <Chip label={valorHumano(r.estado)} size="small" color={estadoChipColor(r.estado)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
                  <Typography fontSize={11} color="text.secondary">
                    Mostrando {rowsPaginadas.length === 0 ? 0 : (paginaAtual - 1) * porPagina + 1} a{" "}
                    {(paginaAtual - 1) * porPagina + rowsPaginadas.length} de {rowsOrdenadas.length} resultado(s)
                  </Typography>
                  <Stack direction="row" spacing={0.75}>
                    <Button type="button" size="small" variant="outlined" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual <= 1}>
                      Anterior
                    </Button>
                    <Button type="button" size="small" variant="outlined" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas}>
                      Seguinte
                    </Button>
                  </Stack>
                </Stack>
              </>
            ) : (
              <Paper component="ul" variant="outlined" sx={{ m: 0, p: 0, listStyle: "none" }}>
                {cardsResumo.map((c, idx) => (
                  <Box
                    key={c.secao}
                    component="li"
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      p: 1.25,
                      borderBottom: idx < cardsResumo.length - 1 ? "1px solid #e2e8f0" : "none",
                    }}
                  >
                    <Typography fontWeight={700}>{tituloSecao(c.secao)}</Typography>
                    <Typography color="text.secondary">{c.total}</Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </>
        )}
      </Stack>
    </SectionCard>
  );
}
