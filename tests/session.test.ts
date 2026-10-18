import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sessionReducer, type SessionState } from "../src/shared/session.ts";

const MIN = 60_000;

// Horas inventadas: el reducer es puro y no depende del reloj real.
const T0 = 1_000_000_000;

const idle: SessionState = { kind: "idle" };
const work = (endsAt: number): SessionState => ({ kind: "work", endsAt });
const workPaused = (remainingTime: number): SessionState => ({
  kind: "workPaused",
  remainingTime,
});
const breakState = (startedAt: number, limitMin: number): SessionState => ({
  kind: "break",
  startedAt,
  limitMin,
});
const breakLimit = (limitMin: number): SessionState => ({
  kind: "breakLimit",
  limitMin,
});

describe("inicio", () => {
  test("START_WORK desde idle arma el fin del trabajo", () => {
    const resultado = sessionReducer(idle, {
      type: "START_WORK",
      workMin: 25,
      at: T0,
    });
    assert.deepEqual(resultado, work(T0 + 25 * MIN));
  });

  test("START_WORK se ignora si ya hay una sesión", () => {
    const actual = work(T0 + 10_000);
    const resultado = sessionReducer(actual, {
      type: "START_WORK",
      workMin: 25,
      at: T0,
    });
    assert.equal(resultado, actual);
  });
});

describe("pausa", () => {
  test("PAUSE guarda el tiempo restante", () => {
    const resultado = sessionReducer(work(T0 + 10 * MIN), {
      type: "PAUSE",
      at: T0 + 2 * MIN,
    });
    assert.deepEqual(resultado, workPaused(8 * MIN));
  });

  test("PAUSE se ignora si ya está pausado", () => {
    const actual = workPaused(5 * MIN);
    const resultado = sessionReducer(actual, { type: "PAUSE", at: T0 });
    assert.equal(resultado, actual);
  });

  test("PAUSE se ignora durante el descanso", () => {
    const actual = breakState(T0, 10);
    const resultado = sessionReducer(actual, { type: "PAUSE", at: T0 + MIN });
    assert.equal(resultado, actual);
  });

  test("PAUSE se ignora en el límite del descanso", () => {
    const actual = breakLimit(10);
    const resultado = sessionReducer(actual, { type: "PAUSE", at: T0 });
    assert.equal(resultado, actual);
  });
});

describe("reanudar", () => {
  test("RESUME recalcula el fin desde el momento actual", () => {
    const resultado = sessionReducer(workPaused(8 * MIN), {
      type: "RESUME",
      at: T0 + 30 * MIN,
    });
    assert.deepEqual(resultado, work(T0 + 38 * MIN));
  });

  test("RESUME se ignora si no está pausado", () => {
    const actual = work(T0 + 5 * MIN);
    const resultado = sessionReducer(actual, { type: "RESUME", at: T0 });
    assert.equal(resultado, actual);
  });
});

describe("descanso", () => {
  test("START_BREAK abre el descanso con el límite configurado", () => {
    const resultado = sessionReducer(work(T0), {
      type: "START_BREAK",
      limitMin: 10,
      at: T0,
    });
    assert.deepEqual(resultado, breakState(T0, 10));
  });

  test("REACH_BREAK_LIMIT detiene el contador en el límite", () => {
    const resultado = sessionReducer(breakState(T0, 10), {
      type: "REACH_BREAK_LIMIT",
      limitMin: 10,
    });
    assert.deepEqual(resultado, breakLimit(10));
  });

  test("REACH_BREAK_LIMIT se ignora durante el trabajo", () => {
    const actual = work(T0 + MIN);
    const resultado = sessionReducer(actual, {
      type: "REACH_BREAK_LIMIT",
      limitMin: 10,
    });
    assert.equal(resultado, actual);
  });

  test("REACH_BREAK_LIMIT se ignora si ya se alcanzó", () => {
    const actual = breakLimit(10);
    const resultado = sessionReducer(actual, {
      type: "REACH_BREAK_LIMIT",
      limitMin: 10,
    });
    assert.equal(resultado, actual);
  });
});

describe("siguiente trabajo", () => {
  test("NEXT_WORK desde el descanso arranca trabajo nuevo", () => {
    const resultado = sessionReducer(breakState(T0, 10), {
      type: "NEXT_WORK",
      workMin: 25,
      at: T0 + 3 * MIN,
    });
    assert.deepEqual(resultado, work(T0 + 3 * MIN + 25 * MIN));
  });

  test("NEXT_WORK desde el límite arranca trabajo nuevo", () => {
    const resultado = sessionReducer(breakLimit(10), {
      type: "NEXT_WORK",
      workMin: 25,
      at: T0,
    });
    assert.deepEqual(resultado, work(T0 + 25 * MIN));
  });

  test("NEXT_WORK se ignora durante el trabajo", () => {
    const actual = work(T0 + MIN);
    const resultado = sessionReducer(actual, {
      type: "NEXT_WORK",
      workMin: 25,
      at: T0,
    });
    assert.equal(resultado, actual);
  });

  test("NEXT_WORK se ignora en idle", () => {
    const resultado = sessionReducer(idle, {
      type: "NEXT_WORK",
      workMin: 25,
      at: T0,
    });
    assert.equal(resultado, idle);
  });
});

describe("terminar", () => {
  test("RESET vuelve al menú desde el trabajo", () => {
    assert.deepEqual(sessionReducer(work(T0 + MIN), { type: "RESET" }), idle);
  });

  test("RESET vuelve al menú desde el descanso", () => {
    assert.deepEqual(
      sessionReducer(breakState(T0, 10), { type: "RESET" }),
      idle,
    );
  });

  test("RESET vuelve al menú desde el límite", () => {
    assert.deepEqual(sessionReducer(breakLimit(10), { type: "RESET" }), idle);
  });
});

describe("flujo completo", () => {
  test("trabajo → descanso → límite → siguiente trabajo", () => {
    let estado: SessionState = idle;

    estado = sessionReducer(estado, { type: "START_WORK", workMin: 25, at: T0 });
    assert.equal(estado.kind, "work");

    estado = sessionReducer(estado, { type: "START_BREAK", limitMin: 10, at: T0 + 25 * MIN });
    assert.equal(estado.kind, "break");

    estado = sessionReducer(estado, { type: "REACH_BREAK_LIMIT", limitMin: 10 });
    assert.equal(estado.kind, "breakLimit");

    estado = sessionReducer(estado, { type: "NEXT_WORK", workMin: 25, at: T0 + 35 * MIN });
    assert.deepEqual(estado, work(T0 + 35 * MIN + 25 * MIN));
  });
});