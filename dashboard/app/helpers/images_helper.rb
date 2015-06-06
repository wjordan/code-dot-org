module ImagesHelper

  def render_image(uri)
    path = uri

    extname = File.extname(path).downcase
    return image_not_found unless image_extnames.include?(extname)

    image_format = extname[1..-1]
    basename = File.basename(path, extname)
    dirname = File.dirname(path)

    # Manipulated?
    if dirname =~ /\/(fit-|fill-)?(\d+)x?(\d*)$/ || dirname =~ /\/(fit-|fill-)?(\d*)x(\d+)$/
      manipulation = File.basename(dirname)
      dirname = File.dirname(dirname)
    end

    # Assume we are returning the same resolution as we're reading.
    retina_in = retina_out = basename[-3..-1] == '@2x'

    path = resolve_image File.join(dirname, basename)
    unless path
      # Didn't find a match at this resolution, look for a match at the other resolution.
      if retina_out
        basename = basename[0...-3]
        retina_in = false
      else
        basename += '@2x'
        retina_in = true
      end
      path = resolve_image File.join(dirname, basename)
    end
    return image_not_found unless path # No match at any resolution.

    image = Magick::Image.read(path).first

    mode = :resize

    if manipulation
      matches = manipulation.match /(?<mode>fit-|fill-)?(?<width>\d*)x?(?<height>\d*)$/m
      mode = matches[:mode][0...-1].to_sym unless matches[:mode].blank?
      width = matches[:width].to_i unless matches[:width].blank?
      height = matches[:height].to_i unless matches[:height].blank?

      if retina_out
        # Manipulated images always specify non-retina sizes in the manipulation string.
        width *= 2 if width
        height *= 2 if height
      end
    else
      width = image.columns
      height = image.rows

      # Retina sources need to be downsampled for non-retina output
      if retina_in && !retina_out
        width /= 2
        height /= 2
      end
    end

    case mode
    when :fill
      # If only one dimension provided, assume a square
      width ||= height
      image = image.resize_to_fill(width, height)
    when :fit
      image = image.resize_to_fit(width, height)
    when :resize
      # If only one dimension provided, assume a square
      height ||= width
      width ||= height
      image = image.resize(width, height)
    else
      raise StandardError, 'Unreachable code reached!'
    end

    image.format = image_format

    expires_in 1.hours, public: true, must_revalidate: true
    render body: image.to_blob, content_type: content_type_from_extname(extname)
  end

  #
  # Search the public/images directory for the most appropriate file to render this image, starting
  # in the current channel's directory and then checking the root (shared) directory.
  #
  # The goal is to allow common content to exist in the root with site-specific content and/or
  # overrides to exist in the channel specific directory.
  #
  def resolve_image(uri)
    base_paths = [
      File.join(Rails.root, 'public', @channel_name, uri),
      File.join(Rails.root, 'public', uri),
    ]

    base_paths.each do |base_path|
      image_extnames.each do |extname|
        path = base_path + extname
        return path if File.file?(path)
      end
    end

    nil
  end

  def image_not_found
    Honeybadger.notify(error_class: 'ImageNotFound', error_message: "ImageNotFound: #{request.original_url}")
    render file: File.join(Rails.root, 'public', '404.html'), status: 404, layout: false
  end

  def content_type_from_extname(extname)
    {
      '.png' => 'image/png',
      '.jpeg' => 'image/jpeg',
      '.jpg' => 'image/jpeg',
      '.gif' => 'image/gif',
    }[extname] || 'application/octet-stream'
  end

  def image_extnames
    [
      '.png',
      '.jpeg',
      '.jpg',
      '.gif',
    ]
  end

end
