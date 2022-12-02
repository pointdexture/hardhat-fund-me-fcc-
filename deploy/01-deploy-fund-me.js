// function deployFunc() {
//   console.log("Hii")
//   hre.getNamedAccount
//   hre.deployments
// }

// module.exports.default = deployFunc (this is for understanding)

// module.exports = async(hre) => {} (both are same function )

/* hre hardhat run environment whenever we run deploy scripts hardhar deploy fuction and passes the 
hardhat object into it. */

// These both are same

/* module.exports = async(hre) => {
    const {getNamedAccounts, deployments} = hre 
} */
// module.exports = async({getNamedAccounts, deployments}) => {}

/* const networkConfig = helperConfig.networkconfig
const helperConfig = require("../helper-hardhat-config")  // for all file  */
const { networkConfig, developmentChains } = require("../helper-hardhat-config") // just the networkConfig
const { netwok } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // if chainId X use address Y
  // if chainId y use address z (so we need to ave github)

  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

  let ethUsdPriceFeedAddress
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  // if the contract doesn't exist, we deploy a minimal version
  // for local testing

  //   what is mocking
  //  well what happen when we want change chains?
  // when going local host or hardhar network we want to use a mock
  // so we need to refactoring our fundme contract

  const args = [ethUsdPriceFeedAddress]
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put priceFeed address
    log: true,
    waitConfirmations: network.config.blockconfirmations || 1,
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
    // then verify
  ) {
    await verify(fundMe.address, args)
  }
  log("--------------------------------------------------------------------")
}
module.exports.tags = ["all", "FundMe"]
