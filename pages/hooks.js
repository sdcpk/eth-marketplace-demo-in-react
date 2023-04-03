import { useEthPrice } from "@components/hooks/useEthPrice";
import { useEffect, useState } from "react"


const useCounter = () => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setInterval(() => {
      setCount( c => c+1)
    }, 1000);
  }, [])
  console.log
  return count
}

const SimpleComponent = () => {
    // const count = useCounter()
    const { eth } = useEthPrice()
    return (
        <h1>{ eth.data }</h1>
    )   
}


export default function Hooks() {
  //const count = useCounter()
  const { eth } = useEthPrice()
  return (
    <>
      <h1> Hello World - {eth.data} </h1>
      <SimpleComponent />
    </>
  )
}