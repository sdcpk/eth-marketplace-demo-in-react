//const { default: Web3 } = require("web3")

const CourseMarketplace = artifacts.require("CourseMarketplace")
const { catchRevert } = require("./utils/exceptions")

//Mocha - testing framework
//Chai - assertion JS library

const getBalance = async address => web3.eth.getBalance(address)
const toBN = value => web3.utils.toBN(value)

const getGas = async result => {
    const tx = await web3.eth.getTransaction(result.tx)
    const gasUsed = toBN(result.receipt.gasUsed)
    const gasPrice = toBN(tx.gasPrice)
    const gas = gasUsed.mul(gasPrice)
    return gas
}

contract("CourseMarketplace", (accounts) => {

    const courseId = "0x00000000000000000000000000003130"
    const proof = "0x0000000000000000000000000000313000000000000000000000000000003130"

    const courseId2 = "0x00000000000000000000000000002130"
    const proof2 = "0x0000000000000000000000000000213000000000000000000000000000002130"

    const value = "900000000"

    let _contract = null
    let contractOwner = null
    let buyer = null
    let courseHash = null

    before(async () => {
        _contract = await CourseMarketplace.deployed()
        contractOwner = accounts[0]
        buyer = accounts[1]
    })

    describe("Purchase the new course", () => {

        before(async () => {
            await _contract.purchaseCourse(courseId, proof, {
                from: buyer,
                value
            })
        })

        it("should NOT be able to repurchase already owned course", async () => {
            await catchRevert(_contract.purchaseCourse(courseId, proof, {
                from: buyer,
                value
            }))
        })

        it("can get the purchased course hash by index", async () => {
            const index = 0
            courseHash = await _contract.getCourseHashAtIndex(index)
            const expectedHash = web3.utils.soliditySha3(
                { type: "bytes16", value: courseId },
                { type: "address", value: buyer }
            )
            assert.equal(courseHash, expectedHash, "Course hash is not matching the hash of purchased course")
        })

        it("should match data of the course purchased by buyer", async () => {
            const expectedIndex = 0
            const expectedState = 0
            const course = await _contract.getCourseByHash(courseHash)
            assert.equal(course.id, expectedIndex, "Course index should be 0")
            assert.equal(course.price, value, `Course price should be ${value}!`)
            assert.equal(course.proof, proof, `Course index should be ${proof}!`)
            assert.equal(course.owner, buyer, `Course buyer should be ${buyer}!`)
            assert.equal(course.state, expectedState, `Course state should be ${expectedState}!`)
        })
    })

    describe("Activate the purchased course", () => {
        it("should NOT be able to activate the course by NOT contract owner", async () => {  
            await catchRevert(_contract.activateCourse(courseHash, {from: buyer}))
        })

        it("should have 'activated' status", async () => {
            await _contract.activateCourse(courseHash, {from: contractOwner})
            const course = await _contract.getCourseByHash(courseHash)
            const expectedState = 1
            assert.equal(course.state, expectedState, "Course should have 'activated' status")
        })
    })

    describe("Activate the purchased course", () => {
        let currentOwner = null
        before(async () => {
            currentOwner = await _contract.getContractOwner()
        })
        it("getContractOwner should return deployed address", async () => {  
            assert.equal(contractOwner, currentOwner, "Contract owner is not matching the one from getContractOwner")
        })

        it("should NOT transfer ownership when contract owner is not sending TX", async () => {
            await catchRevert(_contract.transferOwnership(accounts[3], {from: accounts[4]}))
        })

        it("should transfer ownership to third address from 'accounts'", async () => {
            await _contract.transferOwnership(accounts[2], {from: contractOwner})
            const owner = await _contract.getContractOwner()
            assert.equal(owner, accounts[2], "Contract owner is not the second account")
        })
        it("should transfer ownership to back to initial contract owner", async () => {
            await _contract.transferOwnership(contractOwner, {from: accounts[2]})
            const owner = await _contract.getContractOwner()
            assert.equal(owner, contractOwner, "Contract owner is not set")
        })
    })

    describe("Deactivate course", () => {
        let courseHash2 = null
        let currentOwner = null

        before(async () => {
            await _contract.purchaseCourse(courseId2, proof2, {from: buyer,value })
            courseHash2 = await _contract.getCourseHashAtIndex(1)
            currentOwner = await _contract.getContractOwner()
        })

        it("should NOT be able to deactivate the course by NOT contract owner", async () => {
            await catchRevert(_contract.deactivateCourse(courseHash2, {from: buyer}))
        })
         
        it("should have status of deactivated and price 0", async () => {
            const beforeTXBuyerBalance = await getBalance(buyer)
            const beforeTXContractBalance = await getBalance(_contract.address)
            const beforeTXOwnerBalance = await getBalance(currentOwner)

            const result = await _contract.deactivateCourse(courseHash2, {from: contractOwner})

            const afterTXBuyerBalance = await getBalance(buyer)
            const afterTXContractBalance = await getBalance(_contract.address)
            const afterTXOwnerBalance = await getBalance(currentOwner)

            const course = await _contract.getCourseByHash(courseHash2)
            const expectedState = 2
            const expectedPrice = 0
            const gas = await getGas(result)

            assert.equal(course.state, expectedState, "Course is NOT 'deactivated'")
            assert.equal(course.price, expectedPrice, "Course price is NOT 0!")

            assert.equal(toBN(beforeTXBuyerBalance).add(toBN(value)).toString(), afterTXBuyerBalance, "Buyer balance is not correct") 
            assert.equal(toBN(beforeTXContractBalance).sub(toBN(value)).toString(), afterTXContractBalance, "Contract balance is not correct!")
            assert.equal(toBN(beforeTXOwnerBalance).sub(toBN(gas)).toString(), afterTXOwnerBalance, "Owner balance is not correct!")
        })

        it("should NOT be able to activate deactivated course", async () => {
            await catchRevert(_contract.activateCourse(courseHash2, {from: contractOwner}))
        })
    })
    
    describe("Repurchase course", () => {
        let courseHash2 = null

        before(async () => {
            courseHash2 = await _contract.getCourseHashAtIndex(1)
        })
        
        it("should NOT be able to repurchase when course does not exist", async () => {
            const notExistingHash = "0xeb6c14b85e2c96534fe5b1627a1d4340aa247be16bf7f4a4ff3822d7b273ad70"
            await catchRevert(_contract.repurchaseCourse(notExistingHash, {from: buyer}))
        })
        
        it("should NOT repurchase with NOT course owner", async () => {
            const notOwnerAddress = accounts[2]
            await catchRevert(_contract.repurchaseCourse(courseHash2, {from: notOwnerAddress}))
        })
        
        it("should be able to repurchase with original buyer", async () => {
            const beforeTXBuyerBalance = await getBalance(buyer)
            const beforeTXContractBalance = await getBalance(_contract.address)

            const result = await _contract.repurchaseCourse(courseHash2, {from: buyer, value})
            const afterTXBuyerBalance = await getBalance(buyer)
            const afterTXContractBalance = await getBalance(_contract.address)
            const gas = await getGas(result)

            const course = await _contract.getCourseByHash(courseHash2)
            const expectedState = 0

            assert.equal(course.state, expectedState, "Course is NOT 'purchased'")
            assert.equal(course.price, value, `Course price is not equal to ${value}!`)
            assert.equal(toBN(beforeTXBuyerBalance).sub(toBN(value)).sub(gas).toString(), afterTXBuyerBalance, "Buyer balance is not correct")
            assert.equal(toBN(beforeTXContractBalance).add(toBN(value)).toString(), afterTXContractBalance, "Contract balance is not correct")
        })
        
        it("should not be able to repurchase purchased course", async () => {
            await catchRevert(_contract.repurchaseCourse(courseHash2, {from: buyer, value}))
        })
    
    })

    describe("Receive funds", () => {
        it("should have transacted funds", async () => {
            const value = "100000000000000000"
            const contractBeforeTx = await getBalance(_contract.address)
            await web3.eth.sendTransaction({
                from: buyer,
                to: _contract.address,
                value: value
            })
            const contractAfterTx = await getBalance(_contract.address)
            assert.equal(toBN(contractBeforeTx).add(toBN(value)).toString(), toBN(contractAfterTx), "Value after transaction is not correct")
        })
    })

    describe("Normal withdraw", () => {
        const fundsToDeposit = "100000000000000000"
        const overLimitFunds = "9999900000000000000000"
        let currentOwner = null 

        before(async () => {
            currentOwner = await _contract.getContractOwner()
            await web3.eth.sendTransaction({
                from: buyer,
                to: _contract.address,
                value: fundsToDeposit
            })
        })

        it("should fail when withdrawing with not owner address", async () => {
            const value = "10000000000000000"
            await catchRevert(_contract.withdraw(value, {from: buyer}))
        })

        it("should fail when withdrawing OVER limit balance", async () => {
            await catchRevert(_contract.withdraw(overLimitFunds, {from: currentOwner}))
        })

        it("should have +0.1ETH after withdraw", async () => {
            const ownerBalance = await getBalance(currentOwner)
            const result = await _contract.withdraw(fundsToDeposit, {from: currentOwner})
            const newOwnerBalance = await getBalance(currentOwner)
            const gas = await getGas(result)

            assert.equal(
                toBN(ownerBalance).add(toBN(fundsToDeposit)).sub(gas).toString(), newOwnerBalance, "New owner balance is not correct"
            )
        })
    })

    describe("Emergency withdraw", () => {
        let currentOwner;

        before(async () => {
            currentOwner = await _contract.getContractOwner()
        })

        after(async () => {
            await _contract.resumeContract({from: currentOwner})
        })

        it("should fail when contact is NOT stopped", async () => {
            await catchRevert(_contract.emergencyWithdraw({from: currentOwner}))
        })

        it("should have +contract funds on contract owner", async () => {
            await _contract.stopContract({from: currentOwner})

            const contractBalance = await getBalance(_contract.address)
            const ownerBalance = await getBalance(currentOwner)

            const result = await _contract.emergencyWithdraw({from: currentOwner})
            const gas = await getGas(result)

            const newOwnerBalance = await getBalance(currentOwner)

            assert.equal(toBN(ownerBalance).add(toBN(contractBalance)).sub(gas).toString(), newOwnerBalance, "New owner balance is not correct")
        })

        it("should have contract balance of 0", async () => {
            const contractBalance = await getBalance(_contract.address)
            assert.equal(contractBalance.toString(), "0", "Contract balance is not correct")
        })
    })
    describe("Self Destruct", () => {
        let currentOwner

        before(async () => {
            currentOwner = await _contract.getContractOwner()
        })

        it("should fail when contact is NOT stopped", async () => {
            await catchRevert(_contract.selfDestruct({from: currentOwner}))
        })

        it("should have +contract funds on contract owner", async () => {
            await _contract.stopContract({from: currentOwner})

            const contractBalance = await getBalance(_contract.address)
            const ownerBalance = await getBalance(currentOwner)

            const result = await _contract.selfDestruct({from: currentOwner})
            const gas = await getGas(result)

            const newOwnerBalance = await getBalance(currentOwner)

            assert.equal(toBN(ownerBalance).add(toBN(contractBalance)).sub(gas).toString(), newOwnerBalance, "New owner balance is not correct")
        })

        it("should have contract balance of 0", async () => {
            const contractBalance = await getBalance(_contract.address)
            assert.equal(contractBalance.toString(), "0", "Contract balance is not correct")
        })

        it("should have 0x bytecode", async () => {
            const code = await web3.eth.getCode(_contract.address)
            assert.equal(code, "0x", "Contract is not destroyed")
        })
    })
})