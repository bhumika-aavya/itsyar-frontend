import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CourseService } from "@/services/course.service";

// Students must complete all their enrolled courses before joining a hackathon.
// Participants have no course access at all, so the gate never applies to them.
export function useCourseCompletionGate() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const isStudent = role === "student";
  const [allCoursesCompleted, setAllCoursesCompleted] = useState(true);
  const [checked, setChecked] = useState(!isStudent);

  useEffect(() => {
    if (!isStudent) {
      setAllCoursesCompleted(true);
      setChecked(true);
      return;
    }
    let cancelled = false;
    CourseService.getMyCourses()
      .then(courses => {
        if (cancelled) return;
        setAllCoursesCompleted(courses.length > 0 && courses.every(c => c.courseCompletionPercentage >= 100));
      })
      .catch(() => { if (!cancelled) setAllCoursesCompleted(false); })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [isStudent]);

  return { isStudent, allCoursesCompleted, checked };
}
