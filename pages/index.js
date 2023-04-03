
import { Hero } from "@components/ui/common"
import { CourseList } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"
import { useWeb3 } from "@components/providers"
import { CourseCard } from "@components/ui/course"


export default function Home({courses}) {
  return (
    <>
      <Hero />
      <CourseList
        courses={courses}
      >
        {course => 
          <CourseCard 
            key = {course.id} 
            course={course} />
        }
      </CourseList>
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

Home.Layout = BaseLayout
