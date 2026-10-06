import { afterEach, describe, expect, it } from "vitest";
import { isOpenStatus, normalizeSearch } from "./domain";

const originalPrefix = process.env.PREDITIVA_OPEN_STATUS_PREFIX;
afterEach(() => {
  if (originalPrefix === undefined) delete process.env.PREDITIVA_OPEN_STATUS_PREFIX;
  else process.env.PREDITIVA_OPEN_STATUS_PREFIX = originalPrefix;
});

describe("regra de nota aberta", () => {
  it.each(["OPN", "OPN  URG", "OPN FWO URG"])("considera %s como aberta", (status) => {
    expect(isOpenStatus(status)).toBe(true);
  });

  it.each(["APD", "APD URG", "NCD", ""])("não considera %s como aberta", (status) => {
    expect(isOpenStatus(status)).toBe(false);
  });

  it("permite validar outro código sem alterar o restante da aplicação", () => {
    process.env.PREDITIVA_OPEN_STATUS_PREFIX = "APD";
    expect(isOpenStatus("APD URG")).toBe(true);
    expect(isOpenStatus("OPN URG")).toBe(false);
  });
});

describe("normalização de pesquisa", () => {
  it("ignora acentos, caixa e espaços repetidos", () => {
    expect(normalizeSearch("  Granulação   de MÉTAL ")).toBe("granulacao de metal");
  });
});
