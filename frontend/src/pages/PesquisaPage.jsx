/*
 * Pesquisa global — termo único na API, resultados por secção e filtros locais.
 */

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
import { celulasGrelhaPesquisaGlobal } from "../utils/detalheEquipamento";
import { estadoChipMuiColor } from "../utils/estadoMuiColor";
import { tableCellEllipsis, tableCellMono, tableCellNowrap, tableSxSemQuebra } from "../utils/tableCellSx";

// --- Parsing da resposta API e filtros por secção ---

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

/** Itens para a barra de páginas: números e intervalos "…" quando há muitas páginas. */
function indicadoresPagina(atual, total) {
  if (total <= 1) return [{ type: "page", n: 1 }];
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => ({ type: "page", n: i + 1 }));
  }
  const lado = 1;
  const inicio = Math.max(2, atual - lado);
  const fim = Math.min(total - 1, atual + lado);
  /** @type {Array<{ type: "page"; n: number } | { type: "gap" }>} */
  const out = [{ type: "page", n: 1 }];
  if (inicio > 2) out.push({ type: "gap" });
  for (let i = inicio; i <= fim; i += 1) out.push({ type: "page", n: i });
  if (fim < total - 1) out.push({ type: "gap" });
  out.push({ type: "page", n: total });
  return out;
}

const CHAVES_SECOES_API = ["computadores", "inventarios", "utilizadores", "localizacoes"];

function toSections(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return [{ key: "resultados", value: parsed }];
  if (typeof parsed === "object") {
    if (parsed.erro) return [];
    return Object.entries(parsed)
      .filter(([key]) => CHAVES_SECOES_API.includes(key))
      .map(([key, value]) => ({ key, value }));
  }
  return [{ key: "resultado", value: parsed }];
}

function pesquisaFoiExecutada(globalOutput) {
  return String(globalOutput || "").trim() !== "";
}

function mapaLocalizacoes(localizacoesBase) {
  const porId = new Map();
  (localizacoesBase || []).forEach((loc) => {
    const nome = String(loc?.nome || "").trim();
    if (loc?.id != null && nome) porId.set(Number(loc.id), nome);
  });
  return porId;
}

function secaoSuportaFiltroEstado(secao) {
  const s = normalizarTexto(secao);
  return s === "computadores" || s.includes("dispositivo") || s.includes("ativo");
}

function secaoSuportaFiltroLocalizacao(secao) {
  const s = normalizarTexto(secao);
  return (
    s === "computadores" ||
    s.includes("dispositivo") ||
    s.includes("ativo") ||
    s === "localizacoes"
  );
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

function normalizarTexto(v) {
  return String(v == null ? "" : v)
    .trim()
    .toLowerCase();
}

/** Ordenação “quando foi adicionado”: a API não envia data de criação para todos os tipos; usamos o `id` (ordem típica na BD). */
function instanteOrdenacaoRow(row) {
  const id = Number(row?.item?.id);
  return Number.isFinite(id) ? id : 0;
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
    item?.mac_address,
    item?.origem_registo,
    item?.inventario_nome,
  ]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" ")
    .toLowerCase();
  return texto.includes(termoNormalizado);
}

function normalizarLinha(row, localizacoesPorId) {
  const item = row.item || {};
  const secao = normalizarTexto(row.secao);
  const nome = item.nome || item.hostname || item.email || item.descricao || "—";
  const desc = item.descricao || item.sistema_operativo || item.modelo || "";
  const detalhes = [
    item.numero_serie ? `SN: ${item.numero_serie}` : null,
    item.ip || item.endereco_ip ? `IP: ${item.ip || item.endereco_ip}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const utilizadorAssociado =
    secao === "computadores" || secao.includes("dispositivo") || secao.includes("ativo")
      ? item.utilizador_nome || item.utilizador_responsavel_nome || ""
      : "";

  let localizacao = String(item.localizacao_nome || item.localizacao || "").trim();
  if (!localizacao && item.localizacao_id != null) {
    localizacao = localizacoesPorId.get(Number(item.localizacao_id)) || "";
  }
  if (secao === "localizacoes") {
    localizacao = String(item.nome || localizacao || "").trim();
  }

  return {
    ...row,
    nome,
    desc,
    detalhes,
    localizacao,
    utilizador: utilizadorAssociado,
    estado: String(item.estado || "").trim(),
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
  const [ordem, setOrdem] = useState("novo_antigo");
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
  const localizacoesPorId = useMemo(() => mapaLocalizacoes(localizacoesBase), [localizacoesBase]);
  const pesquisaExecutada = useMemo(() => pesquisaFoiExecutada(globalOutput), [globalOutput]);

  const secoes = useMemo(() => {
    if (!pesquisaExecutada) return secoesBase;

    const fromSearch = toSections(parsed);
    const secoesPesquisa =
      fromSearch.length > 0 ? fromSearch : CHAVES_SECOES_API.map((key) => ({ key, value: [] }));

    if (scansFiltradosPorTermo.length === 0) return secoesPesquisa;

    let encontrouSecaoComputadores = false;
    const merged = secoesPesquisa.map((secao) => {
      if (secao.key !== "computadores") return secao;
      encontrouSecaoComputadores = true;
      const lista = Array.isArray(secao.value) ? secao.value : [secao.value];
      return { ...secao, value: [...lista, ...scansFiltradosPorTermo] };
    });

    if (!encontrouSecaoComputadores) {
      merged.unshift({ key: "computadores", value: scansFiltradosPorTermo });
    }

    return merged;
  }, [parsed, pesquisaExecutada, secoesBase, scansFiltradosPorTermo]);

  const rowsBase = useMemo(() => {
    return secoes.flatMap(({ key, value }) => {
      const lista = Array.isArray(value) ? value : [value];
      return lista.map((item, idx) =>
        normalizarLinha({ key: `${key}-${idx}`, secao: key, item }, localizacoesPorId),
      );
    });
  }, [secoes, localizacoesPorId]);

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

      if (filtroEstado !== "todos") {
        if (!secaoSuportaFiltroEstado(r.secao)) return false;
        if (normalizarTexto(r.estado) !== normalizarTexto(filtroEstado)) return false;
      }

      if (filtroLocalizacao !== "todas") {
        if (!secaoSuportaFiltroLocalizacao(r.secao)) return false;
        if (normalizarTexto(r.localizacao) !== normalizarTexto(filtroLocalizacao)) return false;
      }

      return true;
    });
  }, [rowsBase, filtroSecao, filtroEstado, filtroLocalizacao]);

  const rowsOrdenadas = useMemo(() => {
    const arr = [...rowsFiltradas];
    arr.sort((a, b) => {
      const ta = instanteOrdenacaoRow(a);
      const tb = instanteOrdenacaoRow(b);
      if (ta !== tb) return ordem === "antigo_novo" ? ta - tb : tb - ta;
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt");
    });
    return arr;
  }, [rowsFiltradas, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(rowsOrdenadas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const rowsPaginadas = rowsOrdenadas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  useEffect(() => {
    setPagina(1);
  }, [filtroSecao, filtroEstado, filtroLocalizacao, ordem, globalOutput]);

  useEffect(() => {
    if (filtroSecao !== "todas" && !opcoesTipo.some((o) => o.value === filtroSecao)) {
      setFiltroSecao("todas");
    }
  }, [opcoesTipo, filtroSecao]);

  useEffect(() => {
    if (filtroEstado !== "todos" && !opcoesEstado.some((o) => o.value === filtroEstado)) {
      setFiltroEstado("todos");
    }
  }, [opcoesEstado, filtroEstado]);

  useEffect(() => {
    if (filtroLocalizacao !== "todas" && !opcoesLocalizacao.some((o) => o.value === filtroLocalizacao)) {
      setFiltroLocalizacao("todas");
    }
  }, [opcoesLocalizacao, filtroLocalizacao]);

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

  const erroMensagem =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed?.erro
      ? String(parsed.erro)
      : "";
  const semResultado = !loading && pesquisaExecutada && rowsBase.length === 0;
  const prontoParaPesquisar = !loading && !pesquisaExecutada && rowsBase.length === 0 && !erroMensagem;
  const semResultadosFiltrados =
    !loading && !semResultado && !prontoParaPesquisar && !erroMensagem && rowsBase.length > 0 && rowsOrdenadas.length === 0;
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
                  Pesquisa por nome, hostname, IP, MAC, marca, modelo, série, inventário, localização e responsável.
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
                setOrdem("novo_antigo");
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
                search_off
              </span>
              <Box>
                <Typography fontSize={14} fontWeight={700}>
                  Nenhum resultado para este termo
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  Tenta outro termo ou remove filtros adicionais.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : prontoParaPesquisar ? (
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
            {!pesquisaExecutada ? (
              <Paper variant="outlined" sx={{ px: 1.5, py: 1, bgcolor: "#f8fbff", borderColor: "#dbeafe" }}>
                <Typography fontSize={12} color="text.secondary">
                  A mostrar todos os registos. Introduz um termo e carrega em Pesquisar para refinar.
                </Typography>
              </Paper>
            ) : null}
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
                <Tabs value="resultados" variant="scrollable" allowScrollButtonsMobile>
                  <Tab value="resultados" label="Resultados" />
                </Tabs>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                      value={ordem}
                      onChange={(e) => setOrdem(e.target.value)}
                      displayEmpty
                      aria-label="Ordenação dos resultados"
                    >
                      <MenuItem value="antigo_novo">Do mais antigo ao mais novo</MenuItem>
                      <MenuItem value="novo_antigo">Do mais novo ao mais antigo</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

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
                  overflowX: "auto",
                  "& .MuiTableHead-root .MuiTableCell-root": {
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#e2e8f0",
                    bgcolor: "#0f172a",
                    whiteSpace: "nowrap",
                  },
                  "& .MuiTableBody-root .MuiTableRow-root:hover": {
                    bgcolor: "#eff6ff",
                  },
                  "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
                    bgcolor: "#fbfdff",
                  },
                  "& .MuiTableBody-root .MuiTableCell-root": {
                    py: 1.1,
                    fontSize: 12,
                  },
                }}
              >
                <Table size="small" sx={{ minWidth: 1480, ...tableSxSemQuebra }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell>Hostname</TableCell>
                      <TableCell>IP / rede</TableCell>
                      <TableCell>MAC</TableCell>
                      <TableCell>Marca</TableCell>
                      <TableCell>Modelo</TableCell>
                      <TableCell>Nº série</TableCell>
                      <TableCell>SO</TableCell>
                      <TableCell>Inventário</TableCell>
                      <TableCell>Localização</TableCell>
                      <TableCell>Responsável</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Extra</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rowsPaginadas.map((r) => {
                      const c = celulasGrelhaPesquisaGlobal(r);
                      return (
                        <TableRow key={r.key}>
                          <TableCell sx={{ ...tableCellNowrap, width: 48 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle" }}>
                              {secaoVisual(r.secao).icon}
                            </span>
                          </TableCell>
                          <TableCell sx={tableCellMono(52)}>{c.id}</TableCell>
                          <TableCell sx={tableCellEllipsis(140, 240)} title={c.nome !== "—" ? c.nome : undefined}>
                            <Typography fontSize={12.5} fontWeight={700} noWrap>
                              {c.nome}
                            </Typography>
                          </TableCell>
                          <TableCell sx={tableCellMono(120)} title={c.hostname !== "—" ? c.hostname : undefined}>
                            {c.hostname}
                          </TableCell>
                          <TableCell sx={tableCellMono(118)}>{c.ip}</TableCell>
                          <TableCell sx={tableCellMono(132)}>{c.mac}</TableCell>
                          <TableCell sx={tableCellEllipsis(88, 160)} title={c.marca !== "—" ? c.marca : undefined}>
                            {c.marca}
                          </TableCell>
                          <TableCell sx={tableCellEllipsis(88, 160)} title={c.modelo !== "—" ? c.modelo : undefined}>
                            {c.modelo}
                          </TableCell>
                          <TableCell sx={tableCellMono(100)}>{c.serie}</TableCell>
                          <TableCell sx={tableCellEllipsis(100, 180)} title={c.so !== "—" ? c.so : undefined}>
                            {c.so}
                          </TableCell>
                          <TableCell sx={tableCellEllipsis(120, 200)} title={c.inventario !== "—" ? c.inventario : undefined}>
                            {c.inventario}
                          </TableCell>
                          <TableCell sx={tableCellEllipsis(100, 180)} title={c.localizacao !== "—" ? c.localizacao : undefined}>
                            {c.localizacao}
                          </TableCell>
                          <TableCell sx={tableCellEllipsis(100, 180)} title={c.responsavel !== "—" ? c.responsavel : undefined}>
                            {c.responsavel}
                          </TableCell>
                          <TableCell sx={tableCellNowrap}>
                            {c.estado !== "—" ? (
                              <Chip label={c.estado} size="small" color={estadoChipMuiColor(c.estado)} />
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell sx={tableCellEllipsis(100, 220)} title={c.extra !== "—" ? c.extra : undefined}>
                            {c.extra}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
                <Typography fontSize={11} color="text.secondary">
                  Mostrando {rowsPaginadas.length === 0 ? 0 : (paginaAtual - 1) * porPagina + 1} a{" "}
                  {(paginaAtual - 1) * porPagina + rowsPaginadas.length} de {rowsOrdenadas.length} resultado(s)
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  useFlexGap
                  justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                  alignItems="center"
                >
                  <Button type="button" size="small" variant="outlined" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual <= 1}>
                    Anterior
                  </Button>
                  {totalPaginas > 1
                    ? indicadoresPagina(paginaAtual, totalPaginas).map((it, idx) =>
                        it.type === "gap" ? (
                          <Typography
                            key={`gap-${idx}`}
                            component="span"
                            variant="body2"
                            sx={{ px: 0.35, color: "text.disabled", userSelect: "none", lineHeight: 1 }}
                          >
                            …
                          </Typography>
                        ) : (
                          <Button
                            key={`p-${it.n}`}
                            type="button"
                            size="small"
                            variant={it.n === paginaAtual ? "contained" : "outlined"}
                            disabled={it.n === paginaAtual}
                            onClick={() => setPagina(it.n)}
                            aria-label={`Ir para página ${it.n}`}
                            aria-current={it.n === paginaAtual ? "page" : undefined}
                            sx={{ minWidth: 36, px: 0.75 }}
                          >
                            {it.n}
                          </Button>
                        ),
                      )
                    : null}
                  <Button type="button" size="small" variant="outlined" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas}>
                    Seguinte
                  </Button>
                </Stack>
              </Stack>
            </>
          </>
        )}
      </Stack>
    </SectionCard>
  );
}
