
import { CourseList } from "@components/ui/course"
import { CourseCard } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"
import { useOwnedCourses, useWalletInfo } from "@components/hooks/web3"
import { Button, Loader, Message } from "@components/ui/common"
import { OrderModal } from "@components/ui/order"
import { useState } from "react"
import { MarketHeader } from "@components/ui/marketplace"
import { useWeb3 } from "@components/providers"

export default function Marketplace({courses}) {
  const { web3, contract, requireInstall } = useWeb3()
  const [selectedCourse, setSelectedCourse] = useState(null)
  const { hasConnectedWallet, isConnecting, account } = useWalletInfo()
  const { ownedCourses } = useOwnedCourses(courses, account.data)
  const [isNewPurchase, setIsNewPurchase] = useState(true)

  const purchaseCourse = async order => {

    const hexCourseId = web3.utils.utf8ToHex(selectedCourse.id)
    //0x31343130343734000000000000000000
    //0x9c5043ad454Ae025e4864803f9b7e7DA4601e6E6
    
    const orderHash = web3.utils.soliditySha3(
      { type: "bytes16", value: hexCourseId },
      { type: "address", value: account.data }
    )
    //945f72adc7ef20ab8244b6ee89eb2437413dd837a4ab237c1016c6839a23346b

    const value = web3.utils.toWei(String(order.price))

    if (isNewPurchase) {
      const emailHash = web3.utils.sha3(order.email)
      const proof = web3.utils.soliditySha3(
        { type: "bytes32", value: emailHash },
        { type: "bytes32", value: orderHash }
      )
      _purchaseCourse(hexCourseId, proof, value)
    }
    else {
      _repurchaseCourse(orderHash, value)
    }
  }

  const _purchaseCourse = async (hexCourseId, proof, value) => {
    try {
      const result = await contract.methods.purchaseCourse(
        hexCourseId,
        proof
      ).send({from: account.data, value})
      //console.log(result)
    } catch {
      console.log("Purchase course: Operation has failed")
    }
  }

  const _repurchaseCourse = async (courseHash, value) => {
    try {
      const result = await contract.methods.repurchaseCourse(
        courseHash,
      ).send({from: account.data, value})
      //console.log(result)
    } catch {
      console.log("Purchase course: Operation has failed")
    }    
  }

  return (
    <>
      <MarketHeader />
      <CourseList
        courses={courses}
      >
      {course => {
        const owned = ownedCourses.lookup[course.id]  

        return (
          <CourseCard 
            key = {course.id}
            state={owned?.state} 
            disabled={!hasConnectedWallet}
            course={course} 
            Footer={() => {
              if (requireInstall) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightPurple">
                    Install
                  </Button>
                )
              }

              if (isConnecting) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightPurple">
                    <Loader size="sm"/>
                  </Button>
                )
              }
              console.log(ownedCourses)
              if (!ownedCourses.hasInitialResponse) {
                return (
                  <div style={{height: "42px"}}></div>
                )
              }

              if (owned) {
                return (
                  <>
                    <div className="flex">
                      <Button
                        onClick={() => alert("you are owner of this course")}
                        size="sm"
                        disabled={false}
                        variant="white">
                        Yours &#10004;
                      </Button>
                      { owned.state == "deactivated" &&
                      <div className="ml-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsNewPurchase(false)
                            setSelectedCourse(course)
                          }}
                          variant="purple">
                          Fund to Activate
                        </Button>     
                      </div>                 
                      }
                    </div>               
                  </>
                )
              } 

              return (
                <Button
                  size="sm"
                  onClick={() => setSelectedCourse(course)} 
                  disabled={!hasConnectedWallet}
                  variant="lightPurple">
                  Purchase
                </Button>
              )}
            }
          />
        )}
      }
      </CourseList>
      { selectedCourse && 
        <OrderModal 
          isNewPurchase={isNewPurchase}
          course={selectedCourse}
          onSubmit = {purchaseCourse}
          onClose={() => {
             setSelectedCourse(null)
             setIsNewPurchase(true)
          }}
        />
      }
    </>
  )
}

export function getStaticProps() {
  const { data } = getAllCourses()
  return {
    props: {
      courses: data
    }
  }
}

Marketplace.Layout = BaseLayout
