const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingModule", (m) => {
  // 1. Deploy the Voting contract. It INCLUDES AccessControl.
  const voting = m.contract("Voting");

  // 2. Deploy the Results contract, giving it the address of the Voting contract.
  const results = m.contract("Results", [voting]);

  // Return the deployed contracts. The separate AccessControl is not needed.
  return { voting, results };
});