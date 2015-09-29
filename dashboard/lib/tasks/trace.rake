# Reports the amount of time each Rake task section took when trace is enabled.
if Rake.application.options.trace
  module Rake
    class Task
      def execute_with_timestamps(*args)
        start = Time.now
        execute_without_timestamps(*args)
        execution_time_in_seconds = Time.now - start
        printf("** %s took %.1f seconds\n", name, execution_time_in_seconds)
      end

      alias :execute_without_timestamps :execute
      alias :execute :execute_with_timestamps
    end
  end
end
