import { Message, Offset, Row, ShapeStream } from "@electric-sql/client";
import { writeFileSync, readFileSync } from "node:fs";

const OFFSET_FILE = "offset";
const HANDLE_FILE = "handle";
let offset: Offset | undefined = undefined;
let handle: string | undefined = undefined;
try {
  offset = readFileSync(OFFSET_FILE, "utf-8") as Offset;
  handle = readFileSync(HANDLE_FILE, "utf-8");
} catch (e) {}

export function createStreamListener(props: {
  table: string;
  callback: (values: Message<Row<never>>[]) => Promise<void>;
}) {
  let offset: Offset | undefined = undefined;
  let handle: string | undefined = undefined;

  const offsetFile = `${props.table}.offset`;
  const handleFile = `${props.table}.handle`;

  try {
    offset = readFileSync(offsetFile, "utf-8") as Offset;
    handle = readFileSync(handleFile, "utf-8");
  } catch (e) {}

  let stream = new ShapeStream({
    url: `http://localhost:3000/v1/shape`,
    offset,
    handle,
    params: {
      table: props.table,
      replica: "full",
    },
  });

  stream.subscribe(async (data) => {
    const values = [...data.values()].filter(
      (value) => value.headers.control !== "up-to-date"
    );

    if (values.length === 1 && values[0].headers.control === "up-to-date") {
      console.log("up-to-date");
      return;
    }

    props.callback(values);

    writeFileSync(offsetFile, stream.lastOffset);
    stream.shapeHandle && writeFileSync(handleFile, stream.shapeHandle);

    console.log(
      `Processed ${values.length} rows. New offset: ${stream.lastOffset} in handle: ${stream.shapeHandle}`
    );
  }, console.error);
}
