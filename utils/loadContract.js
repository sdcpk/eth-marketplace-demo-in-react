
const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID

export const loadContract = async (name, web3) => {
    const response = await fetch(`/contracts/${name}.json`)
    const Artifact = await response.json()

    let contract=null

    try {
        contract = new web3.eth.Contract(
            Artifact.abi, 
            Artifact.networks[NETWORK_ID].address
        )
    } catch {
        console.log(`Contract ${name} cannot be loaded`)
    }

    return contract
}
// export const loadContract = async (name, provider) => {
//     const response = await fetch(`/contracts/${name}.json`)
//     const Artifact = await response.json()

//     const _contract = contract(Artifact)
//     _contract.setProvider(provider)
    
//     let deployedContract = null
//     try {
//         deployedContract = await _contract.deployed()
//     } catch {
//         console.log(`Contract ${name} cannot be loaded`)
//     }

//     return deployedContract
// }