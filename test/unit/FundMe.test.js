const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      let sendValue = ethers.utils.parseEther("1") // 1 ETH
      beforeEach(async function () {
        // deploy fundme contract
        // using hardhat-deploy
        // const accounts = await ethers.getSigner()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async function () {
        it("Fails if you dont send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })
        it("update the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("add funder to array of getFunder", async function () {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single funder", async function () {
          // arrange
          const satartingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const satartingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          //  act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          // assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            satartingFundMeBalance.add(satartingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("allows us to withdraw with multiple getFunder", async function () {
          // arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const satartingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const satartingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //   Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            satartingFundMeBalance.add(satartingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //   make sure that getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows to owner to withraw", async function () {
          const accounts = await ethers.getSigners()
          const fundMeConnectedContract = await fundMe.connect(accounts[1])
          await expect(fundMeConnectedContract.withdraw()).to.be.reverted
        })

        it("cheaperWithdraw testing...", async function () {
          // arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const satartingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const satartingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //   Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          // Assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            satartingFundMeBalance.add(satartingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //   make sure that getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
