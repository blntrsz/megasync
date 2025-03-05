import type { ShapeStream } from "@electric-sql/client";
import React from "react";

const StreamContext = React.createContext<Record<string, ShapeStream>>({});

export function StreamProvider({ children, streams }: any) {
  return (
    <StreamContext.Provider value={streams}>{children}</StreamContext.Provider>
  );
}

export function useStream(table: string) {
  const streams = React.useContext(StreamContext);
  return streams[table];
}
