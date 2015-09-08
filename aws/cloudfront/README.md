Contains CloudFront provisioning configuration.

CDO environment variables used:

#### `CDO.cloudfront` (`pegasus` and `dashboard`)

- `aliases`: whitelist of domains allowed to use with this distribution (`*`-wildcards are allowed, e.g. `*.example.com`).
- `origin`: default origin server endpoint. This should point to the load balancer domain.
- `log`: `log.bucket` and `log.prefix` specify where to store CloudFront access logs (or disable if `log` is not provided).
- `iam_certificate_id`: The IAM certificate ID to use.
  If not provided, the default *.cloudfront.net SSL certificate is used.

#### `CDO.http_cache` (`pegasus` and `dashboard`)

- `behaviors`: Array of behaviors:
  - `path`: [Path pattern](http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesPathPattern)
    to match this behavior against.
    `*`-globs are allowed, e.g. `*.jpg` or `api/*`, and `?` matches a single character.
    - If `path` is an array, a separate behavior will be generated for each element of the array.
  - `headers`: A whitelist array of HTTP header keys to pass to the origin and include in the cache key.
    To whitelist all headers, pass `['*']`.
    To strip all headers, pass `[]`.
  - `cookies`: A whitelist array of HTTP cookie keys to to pass to the origin and include in the cache key.
    To whitelist all cookies, pass `'all'`.
    To strip all cookies, pass `'none'`.
- `default`: Default behavior if no other path patterns are matched. Uses the same syntax as `behaviors` except `path` is not required.
