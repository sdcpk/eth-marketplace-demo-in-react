import { useEffect } from "react"
import useSWR from "swr"

const adminAddresses = {
    "0x3bb3b79dedfdb4e9eb734f40c6e1a5a0e1726302de271a6445cbec33a06bdeb6": true
}

export const handler = (web3, provider) => () => {


    const { data, mutate, ...rest } = useSWR(() => 
        web3 ? "web3/accounts": null,
        async () => {
            const accounts = await web3.eth.getAccounts()
            return accounts[0]
        }
    )

    useEffect(() => {
        provider && 
        provider.on("accountsChanged", 
            accounts => mutate(accounts[0] ?? null)
        )
    }, [provider])

    return { 
        data,
        isAdmin: (data && adminAddresses[web3.utils.keccak256(data)]) ?? false,
        mutate, ...rest
    }
}