const ETHProfile = artifacts.require("../contracts/ETHProfile");

const utils = require('./helpers/Utils');


contract('ETHProfile', function(accounts) {


  it("Verifies that I can deploy an ETHProfile", async () => {

    let ethp = await ETHProfile.new();

    await ethp.addProfile("QmbZvrSP5f5NvQJgKLvCZyAhVBHbfm5NqWmiZzS6iZEpuu");
  });

});
