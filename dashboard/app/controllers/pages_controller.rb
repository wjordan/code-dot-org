#
# The "pages" controller introduces the concept of pages to the rails application. Pages obviate
# the need to create a route, controller, and view just to render a piece of content. Instead,
# everything necessary to render the page is included in one place and the route to the page is
# implied by... the name of the page.
#
# Pages can be implemented in any markup language we care to support, currently HAML, HTML[+ERB],
# and Markdown[+ERB].
#
class PagesController < ApplicationController

  include PagesHelper
  include ImagesHelper

  def page()
    expires_in 1.hours, public: true, must_revalidate: true
    render_page request.path_info
  end

  def image()
    expires_in 1.hours, public: true, must_revalidate: true
    render_image request.path_info
  end

end
