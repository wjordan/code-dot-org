require 'test_helper'

class Plc::UserCourseEnrollmentTest < ActiveSupport::TestCase
  setup do
    @user = create :teacher
    @course = create :plc_course
    @course_unit1 = create(:plc_course_unit, plc_course: @course)
    @course_unit2 = create(:plc_course_unit, plc_course: @course)
  end

  test 'Enrolling user in a task creates unit enrollments' do
    Plc::UserCourseEnrollment.enroll_users([@user.email], @course.id)
    enrollment = Plc::UserCourseEnrollment.find_by(user: @user)

    assert_equal [@course_unit1, @course_unit2], enrollment.plc_unit_assignments.map(&:plc_course_unit)
    assert_equal [Plc::EnrollmentUnitAssignment::START_BLOCKED], enrollment.plc_unit_assignments.map(&:status).uniq
  end

  test 'test bulk enrollments' do
    @student = create :student
    student_email = 'some_student@code.org'
    @student.update(email: student_email)
    nonexistent_email = 'wrong-email@wrong.com'

    created_enrollments, nonexistent_users, nonteacher_users, other_failure_users =
      Plc::UserCourseEnrollment.enroll_users([@user.email, nonexistent_email, student_email], @course.id)

    assert_equal created_enrollments, [@user.email]
    assert_equal nonexistent_users, [nonexistent_email]
    assert_equal nonteacher_users, [student_email]
    assert_empty other_failure_users
  end

  test 'enrolling in a started course creates unit enrollments that are in progress' do
    @course_unit1.update(started: true)

    Plc::UserCourseEnrollment.enroll_users([@user.email], @course.id)
    enrollment = Plc::UserCourseEnrollment.find_by(user: @user)

    assert_equal [@course_unit1, @course_unit2], enrollment.plc_unit_assignments.map(&:plc_course_unit)
    assert_equal [Plc::EnrollmentUnitAssignment::IN_PROGRESS, Plc::EnrollmentUnitAssignment::START_BLOCKED], enrollment.plc_unit_assignments.map(&:status)
  end
end
