import { beforeEach, describe, expect, it, vi } from "vitest";
import { replaceFileAtomically } from "./atomic-file-replace";

const io = vi.hoisted(() => ({ rename: vi.fn(), delay: vi.fn() }));
vi.mock("node:fs/promises", () => ({ rename: io.rename }));
vi.mock("node:timers/promises", () => ({ setTimeout: io.delay }));

beforeEach(() => {
  io.rename.mockReset().mockResolvedValue(undefined);
  io.delay.mockReset().mockResolvedValue(undefined);
});

const failure = (code: string) => Object.assign(new Error("Falha simulada"), { code });

describe("substituição atômica do Excel", () => {
  it("substitui o arquivo sem apagar antecipadamente a base válida", async () => {
    await replaceFileAtomically("notas.tmp", "notas.xlsx");
    expect(io.rename).toHaveBeenCalledExactlyOnceWith("notas.tmp", "notas.xlsx");
  });

  it("repete apenas falhas transitórias do Windows", async () => {
    io.rename.mockRejectedValueOnce(failure("EPERM")).mockResolvedValueOnce(undefined);
    await replaceFileAtomically("notas.tmp", "notas.xlsx");
    expect(io.rename).toHaveBeenCalledTimes(2);
    expect(io.delay).toHaveBeenCalledWith(25);
  });

  it("não mascara falha de disco", async () => {
    const error = failure("ENOSPC");
    io.rename.mockRejectedValue(error);
    await expect(replaceFileAtomically("notas.tmp", "notas.xlsx")).rejects.toBe(error);
  });
});
