type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown>;

function emit(level: Level, msg: string, fields?: Fields) {
  const record = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(record);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  debug: (msg: string, fields?: Fields) => {
    if (process.env.NODE_ENV === "development") emit("debug", msg, fields);
  },
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, err?: unknown, fields?: Fields) => {
    const errFields =
      err instanceof Error
        ? { errName: err.name, errMsg: err.message, stack: err.stack }
        : err !== undefined
          ? { err: String(err) }
          : {};
    emit("error", msg, { ...errFields, ...fields });
  },
};
