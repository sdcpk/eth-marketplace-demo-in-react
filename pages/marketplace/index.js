
import { CourseList } from "@components/ui/course"
import { CourseCard } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"
import { useOwnedCourses, useWalletInfo } from "@components/hooks/web3"
import { Button, Loader } from "@components/ui/common"
import { OrderModal } from "@components/ui/order"
import { useState } from "react"
import { MarketHeader } from "@components/ui/marketplace"
import { useWeb3 } from "@components/providers"
import { withToast } from "@utils/toast"

export default function Marketplace({courses}) {
  const { web3, contract, requireInstall } = useWeb3()
  const [selectedCourse, setSelectedCourse] = useState(null)
  const { hasConnectedWallet, isConnecting, account } = useWalletInfo()
  const { ownedCourses } = useOwnedCourses(courses, account.data)
  const [busyCourseId, setBusyCourseId] = useState(null)
  const [isNewPurchase, setIsNewPurchase] = useState(true)

  const purchaseCourse = async (order, course) => {

    const hexCourseId = web3.utils.utf8ToHex(course.id)
    //0x31343130343734000000000000000000
    //0x9c5043ad454Ae025e4864803f9b7e7DA4601e6E6
    
    const orderHash = web3.utils.soliditySha3(
      { type: "bytes16", value: hexCourseId },
      { type: "address", value: account.data }
    )
    //945f72adc7ef20ab8244b6ee89eb2437413dd837a4ab237c1016c6839a23346b

    const value = web3.utils.toWei(String(order.price))
    
    setBusyCourseId(course.id)
    if (isNewPurchase) {
      const emailHash = web3.utils.sha3(order.email)
      const proof = web3.utils.soliditySha3(
        { type: "bytes32", value: emailHash },
        { type: "bytes32", value: orderHash }
      )
      withToast(_purchaseCourse({hexCourseId, proof, value}, course))
    }
    else {
      withToast(_repurchaseCourse({courseHash: orderHash, value}, course))
    }
  }

  const _purchaseCourse = async ({hexCourseId, proof, value}, course) => {
    try {
      const result = await contract.methods.purchaseCourse(
        hexCourseId,
        proof
      ).send({from: account.data, value})

      ownedCourses.mutate([
        ...ownedCourses.data, {
          ...course,
          proof,
          state: "purchased",
          owner: account.data,
          price: value
        }
      ])
      return result 
    } catch(error) {
      throw new Error(error.message)
    } finally {
      setBusyCourseId(null)
    }
  }

  const _repurchaseCourse = async ({courseHash, value}, course) => {
    try {
      const result = await contract.methods.repurchaseCourse(
        courseHash,
      ).send({from: account.data, value})
      
      const index = ownedCourses.data.findIndex(c => c.id === course.id)

      if (index >= 0 ) {
        ownedCourses.data[index].state = "purchased"
        ownedCourses.mutate(ownedCourses.data)
      }
      else {
        ownedCourse.mutate()
      }
      ownedCourses.mutate()
      return result 
    } catch(error) {
      throw new Error(error.message)
    } finally {
      setBusyCourseId(null)
    }    
  }

  const cleanupModal = () => {
    setSelectedCourse(null)
    setIsNewPurchase(true)
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
              //console.log(ownedCourses)
              if (!ownedCourses.hasInitialResponse) {
                return (
                  //<div style={{height: "42px"}}></div>
                  <Button
                    variant="white"
                    disabled={true}
                    size="sm">
                    Loading
                  </Button>
                )
              }
              const isBusy = busyCourseId === course.id
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
                          disabled={isBusy}
                          onClick={() => {
                            setIsNewPurchase(false)
                            setSelectedCourse(course)
                          }}
                          variant="purple">
                          { isBusy ?
                            <div className="flex">
                              <Loader size="sm"/>
                              <div className="ml-2">In progress</div>
                            </div> :
                            <div>Fund to activate</div>
                          }
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
                  disabled={!hasConnectedWallet ||  isBusy}
                  variant="lightPurple">
                  {
                    isBusy ?
                    <div className="flex">
                      <Loader size="sm"/>
                      <div className="ml-2">In progress</div>
                    </div> :
                    <div>Purchase</div>
                  }
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
          onSubmit = {(formData, course) => {
            purchaseCourse(formData, course)
            cleanupModal()
          }}
          onClose={cleanupModal}

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
