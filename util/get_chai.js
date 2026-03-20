// store the Chai setup, ater hold expect and request, This prevents loading Chai multiple times.
let chai_obj = null;

const get_chai = async () => {
  // ensures use() is called only once
  if (!chai_obj) {
    // expect (for assertions), use (to register plugins)
    const { expect, use } = await import("chai");
    // Loads the HTTP testing plugin
    const chaiHttp = await import("chai-http");
    // Registers the plugin, chaiHttp.default is needed because of how ESM exports work.
    const chai = use(chaiHttp.default);
  /* This is called caching
    Stores the tools: expect , request
    Saves them so future calls don’t reload Chai
    */
    chai_obj = { expect: expect, request: chai.request };
  }
  return chai_obj;
};

module.exports = get_chai;