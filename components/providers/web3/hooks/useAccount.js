import { useEffect } from "react"
import useSWR from "swr"

const adminAddresses = {
    "0x157de338d977ef9eb5bed510ff795c3f9621be7792249b03f7e535c643c3940e": true
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