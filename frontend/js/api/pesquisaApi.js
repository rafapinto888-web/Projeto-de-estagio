import { http } from "../core/http.js";

export const pesquisaApi = {
  global: (pesquisa) => http(`/pesquisar?pesquisa=${encodeURIComponent(pesquisa)}`),
};
