module PagesHelper

  def render_page(uri, params={})
    @layout = params[:layout] || 'application'

    if path  = resolve_template(uri)
      render file: path, layout: 'page'
    else
      page_not_found
    end
  end

  #
  # Search the app/pages/ directory for the most appropriate file to render this page, starting in
  # the current channel's directory and then checking the root (shared) directory. "index" is the
  # file rendered if the URI referenes just a directory name.
  #
  # The goal is to allow common content to exist in the root with site-specific content and/or
  # overrides to exist in the channel specific directory.
  #
  def resolve_template(uri)
    base_paths = [
      File.join(Rails.root, 'app', 'pages', request.site, uri),
      File.join(Rails.root, 'app', 'pages', request.site, uri, 'index'),
      File.join(Rails.root, 'app', 'pages', request.site, uri, 'splat'),
      File.join(Rails.root, 'app', 'pages', 'shared', uri),
      File.join(Rails.root, 'app', 'pages', 'shared', uri, 'index'),
      File.join(Rails.root, 'app', 'pages', 'shared', uri, 'splat'),
    ]

    base_paths.each do |base_path|
      template_extnames.each do |extname|
        path = base_path + extname
        return path if File.file?(path)
      end
    end

    splats = []
    while uri != '/'
      splats.unshift File.basename(uri)
      uri = File.dirname(uri)

      if path = resolve_splat_template(uri)
        params[:splat] = splats.join('/')
        return path
      end
    end

    nil
  end

  def resolve_splat_template(uri)
    splat_paths = [
      File.join(Rails.root, 'app', 'pages', request.site, uri, 'splat'),
      File.join(Rails.root, 'app', 'pages', 'shared', uri, 'splat'),
    ]
    splat_paths.each do |base_path|
      template_extnames.each do |extname|
        path = base_path + extname
        return path if File.file?(path)
      end
    end

    nil
  end

  def page_not_found
    Honeybadger.notify(error_class: 'PageNotFound', error_message: "PageNotFound: #{request.original_url}")
    render file: File.join(Rails.root, 'public', '404.html'), status: 404, layout: false
  end

  def template_extnames
    [
      '.haml',
      '.html',
      '.html.erb',
      '.md',
    ]
  end

end
