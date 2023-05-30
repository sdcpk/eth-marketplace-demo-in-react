import { useEffect } from "react"
import useSWR from "swr"

const adminAddresses = {
    "0x1bf51bf460790bcd8e27b074e916a391b84e82684b90e3e555766a0c98bd3f63": true
}  

export const handler = (web3, provider) => () => {


    const { data, mutate, ...rest } = useSWR(() => 
        web3 ? "web3/accounts": null,
        async () => {
            const accounts = await web3.eth.getAccounts()
            const account = accounts[0]
            if(!account) {
                throw new Error("Account not found. Please refresh browser")
            }
            return account
        }
    )

    useEffect(() => {
        const mutator = accounts => mutate(accounts[0] ?? null)
        provider?.on("accountsChanged", mutator)


        return () => {
            provider?.removeListener("accountsChanged", mutator)
        }
    }, [provider])

    return { 
        data,
        isAdmin: (data && adminAddresses[web3.utils.keccak256(data)]) ?? false,
        mutate, ...rest
    }
}