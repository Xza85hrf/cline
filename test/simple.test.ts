import { describe, it } from "mocha";
import "should";

describe("Simple Test", () => {
  it("should pass", () => {
    (1 + 1).should.equal(2);
  });
});
