FROM alpine:edge
COPY ./install.sh /cdo/install.sh
RUN /cdo/install.sh
ADD Gemfile /cdo/Gemfile
ADD Gemfile.lock /cdo/Gemfile.lock
RUN BUNDLE_APP_CONFIG=/tmp \
  BUNDLE_GEMFILE=/cdo/Gemfile \
  BUNDLE_WITHOUT=development:production:staging:test:levelbuilder:integration \
  bundle install --system
