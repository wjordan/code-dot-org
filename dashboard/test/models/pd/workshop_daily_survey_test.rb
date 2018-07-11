require 'test_helper'

module Pd
  class WorkshopDailySurveyTest < ActiveSupport::TestCase
    FAKE_FORM_ID = 12345
    FAKE_SUBMISSION_ID = 67890

    self.use_transactional_test_case = true
    setup_all do
      @user = create :user
      @pd_workshop = create :pd_workshop, num_sessions: 5
    end

    test 'response_exists? and create_placeholder!' do
      refute WorkshopDailySurvey.response_exists?(**placeholder_params)

      placeholder = WorkshopDailySurvey.create_placeholder!(submission_id: FAKE_SUBMISSION_ID, **placeholder_params)
      assert placeholder.placeholder?

      assert WorkshopDailySurvey.response_exists?(**placeholder_params)
    end

    test 'duplicate?' do
      # not a duplicate
      create :pd_workshop_daily_survey

      submission = build :pd_workshop_daily_survey, placeholder_params
      refute submission.duplicate?

      submission.save!

      # Same user, workshop, day, & form. New submission id
      new_submission = build :pd_workshop_daily_survey, placeholder_params
      refute submission.duplicate?
      assert new_submission.duplicate?
      refute new_submission.valid?
    end

    private

    def placeholder_params
      @placeholder_params ||= {
        user_id: @user.id,
        pd_workshop_id: @pd_workshop.id,
        day: 1,
        form_id: FAKE_FORM_ID
      }
    end
  end
end
