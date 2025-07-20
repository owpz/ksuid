import { test } from "uvu";
import * as assert from "uvu/assert";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const testKSUID = "0o5sKzFDBc56T8mbUP8wH1KpSX7";

test("Template: .String field works with Go syntax", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .String }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), testKSUID);
});

test("Template: String field works with simple syntax", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ String }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), testKSUID);
});

test("Template: .Timestamp field works", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .Timestamp }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "95004740");
});

test("Template: .Payload field works", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .Payload }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "669F7EFD7B6FE812278486085878563D");
});

test("Template: .Raw field works", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .Raw }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "05A9A844669F7EFD7B6FE812278486085878563D");
});

test("Template: .Time field works", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .Time }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "2017-05-17T07:05:40.000Z");
});

test("Template: Mixed Go and simple syntax", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .String }}-{{ Timestamp }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "0o5sKzFDBc56T8mbUP8wH1KpSX7-95004740");
});

test("Template: JSON format with Go syntax", async () => {
  const template =
    '{ "ksuid": "{{ .String }}", "timestamp": "{{ .Timestamp }}" }';
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t '${template}' ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(
    stdout.trim(),
    '{ "ksuid": "0o5sKzFDBc56T8mbUP8wH1KpSX7", "timestamp": "95004740" }'
  );
});

test("Template: Whitespace handling", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{.String}} {{  .Timestamp  }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "0o5sKzFDBc56T8mbUP8wH1KpSX7 95004740");
});

test("Template: Unknown fields remain unchanged", async () => {
  const { stdout, stderr } = await execAsync(
    `npx ts-node src/cli.ts -f template -t "{{ .Unknown }}-{{ .String }}" ${testKSUID}`
  );
  assert.is(stderr, "");
  assert.is(stdout.trim(), "{{ .Unknown }}-0o5sKzFDBc56T8mbUP8wH1KpSX7");
});

test.run();
