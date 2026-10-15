import { writeFileSync } from "node:fs";
import { s1Fixture } from "./s1-fixture.ts";
import { checkS1 } from "./s1-check.ts";
writeFileSync(
  "benchmarks/s1-node-results.json",
  JSON.stringify(await checkS1(s1Fixture()), null, 2),
);
console.log("S1 G PASS");
